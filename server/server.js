const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const MBTiles = require('@mapbox/mbtiles');
const uuidv1 = require('uuid/v1')
const mysql = require('mysql2');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client('868028424466-1c3gfknc5gtqecdig25d7cpv3rhjpc1e.apps.googleusercontent.com');
const privateKey = fs.readFileSync('./sslcert/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./sslcert/cert.pem', 'utf8');
const ca = fs.readFileSync('./sslcert/chain.pem', 'utf8');
const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

//He3zZ6ka3chP29MB

let busStops = JSON.parse(fs.readFileSync('busstops.json'));
let simTrack = JSON.parse(fs.readFileSync('route2.json'));

const simulateBus = true;
let trackPoint = 0;

if (simulateBus) {
	setInterval(function(){ updateTrack(); }, 3000);
}

let gps = {
  lat: 0,
  lon: 0,
  time: 0,
}

let app = express();
app.use(bodyParser.json());

let connection;

function connectToDB() {
  connection = mysql.createConnection({
		host: 'localhost',
		user: 'remote',
		database: 'unibus',
		password: 'He3zZ6ka3chP29MB',
		multipleStatements: true,
		supportBigNumbers: true
  });

  connection.connect(function(err) {
    if(err) {
      console.log('database connection error:', err);
      setTimeout(connectToDB, 2000);
    }
    else {
      console.log("!!Connected to DB!!");
    }
  });

  connection.on('error', function(err) {
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Attempting connection to DB');
      connectToDB();
    } else {
      throw err;
    }
  });
}

connectToDB();

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

//--GOOGLE AUTHENTICATION--
async function verify(token) {
  try{
    let ticket = await client.verifyIdToken({
        idToken: token,
        audience: '868028424466-1c3gfknc5gtqecdig25d7cpv3rhjpc1e.apps.googleusercontent.com',
    });
    let payload = ticket.getPayload();
    let userid = payload['sub'];
    return userid;
  }
  catch(e){
    return "error"
  }
}

function updateTrack(){
	if (trackPoint == simTrack.features.length) {
		trackPoint=0;
	}
	gps = {
		lat: simTrack.features[trackPoint].geometry.coordinates[1],
		lon: simTrack.features[trackPoint].geometry.coordinates[0],
		time: "simulated"
	}
	trackPoint++
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/gps', logGPS);
app.post('/synctt', synctt);
app.post('/userstatus', isRegisteredUser);
app.post('/timetable', getTimetable);
app.get('/clear', clearData);
app.get('/gpsdata', showData);
app.get('/times', showTimes);
app.get('/tile/:z/:x/:y.*', showTile);
app.get('/delay', showDelay);

async function searchForUser(userID){
	if (userID != "e" && userID != "error") {
		let [rows, fields] = await connection.promise().query('SELECT userID FROM USERS WHERE userID = ?',[userID])
		if (rows.length == 0) {
			return false
		}
		else {
			return true
		}
	}
	else {
		return "error"
	}
}

async function isRegisteredUser(req,res,next){
	const googleID = await verify(req.body.token)
	const userRegistered = await searchForUser(googleID)
	if (userRegistered != "error") {
		res.json({
			userRegistered: userRegistered,
			id: googleID
		})
	}
	else {
		res.status(400);
	}
}

// Load map tiles to client side
function showTile(req,res,next){
  new MBTiles('./mbtiles/portsmouth.mbtiles?mode=rw', function(err, mbtiles) {
    mbtiles.getTile(req.params.z, req.params.x, req.params.y, function(err, data, headers) {
      if (err) {
        res.status(404)
      } else {
        res.header("Content-Type", "image/png")
        res.send(data);
      }
    });
  });
}

// Takes gps data from the tracker and stores it
function logGPS(req,res,next){
  gps = {
    lat: req.body.lat,
    lon: req.body.lon,
    time: new Date()
  }
  res.sendStatus(200)
}

function showData(req,res,next){
  res.json(gps)
}

function clearData(req,res,next){
  gps = {
    lat: 'n/a',
    lon: 'n/a',
    time: 'n/a'
  }
  res.send('Data Cleared')
}

function showTimes(req,res,next){
	if (req.query.stop == null) {
		res.send(busStops)
	}
	else {
		res.send(busStops.stops[req.query.stop][3])
	}
}

function showDelay(req,res,next){
	let expectedTime = req.query.eTime
	let stop = req.query.stop
	if (stop >= 0 && stop < busStops.stops.length){
		res.json(calculateDelay(expectedTime,stop))
	}
	else {
		res.json({"status": "FAILED, not a valid stop"})
	}
}

function calculateDelay(expectedTime,stop){
	let foundStop = false;
	let index = closestStopToBus();
	let closestStop = index;
	let time = 0;
	let status = "On Time"
	while (foundStop == false){
		if (index >= busStops.stops.length){
			index = 0;
		}
		else if (index == stop) {
			foundStop = true;
		}
		else {
			time += busStops.stops[index][1]
			index++
		}
	}
	let timeOffset = getOffsetTime(time);
	if (timeOffset > parseInt(expectedTime) + 600) {
		status = "Late"
	}
	return ({
		"status": status,
		"eta": timeOffset,
		"closestStop": busStops.stops[closestStop][0]
	})
}

function getOffsetTime(estimatedMinutes){
	let time = new Date();
	let calculatedTime = (time.getTime())+((estimatedMinutes*60)*1000)
	return Math.floor(calculatedTime/1000)
}

function closestStopToBus(){
	let shortestDistance = 999999;
	let closestStop;
	let currentGPS = gps
	for (let index = 0; index < busStops.stops.length; index++){
			let distance = distanceBetweenPoints(currentGPS.lat, currentGPS.lon, busStops.stops[index][2][0], busStops.stops[index][2][1])
			if (distance < shortestDistance){
				closestStop = index;
				shortestDistance = distance
			}
	}
	return closestStop
}

function distanceBetweenPoints(lat1,lon1,lat2,lon2) {
  let earthRadius = 6371;
  let dLat = (lat2-lat1) * (Math.PI/180);
  let dLon = (lon2-lon1) * (Math.PI/180);
  let a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  let d = earthRadius * c;
  return d;
}

//-----------------------USER DATA----------------------------------
async function getTimetable(req,res,next){
	const googleID = await verify(req.body.token)
	const userRegistered = await searchForUser(googleID);
	if (userRegistered != "error") {
		let [rows, fields] = await connection.promise().query('SELECT * FROM EVENTS WHERE userID = ? ORDER BY startTime',[googleID])
		res.json(rows);
	}
	else {
		res.sendStatus(400)
	}
}

async function synctt(req,res,next){
	const googleID = await verify(req.body.token)
	const events = req.body.ttdata
	const userRegistered = await searchForUser(googleID);
	if (userRegistered != "error"){
		if (userRegistered) {
			connection.query('DELETE FROM EVENTS WHERE userID = ?',[googleID],
		    function(err, results, fields) {
		      if (err) {
		        res.sendStatus(400);
		      }
		      else {
						try{
							let failed = false
							for (let eventObject of events){
								connection.query('INSERT INTO EVENTS VALUES(?,?,?,?,?,?)',[googleID,uuidv1(),eventObject.summary,eventObject.location,dateToDay(eventObject.start.dateTime), dateToUnix(eventObject.start.dateTime)],
						    function(err, results, fields) {
									if (err) {
										failed = true
									}
								});
							}
							if (failed) {
								res.sendStatus(400);
							}
							else {
								res.sendStatus(200)
							}
						}
						catch(err){
							res.sendStatus(400)
						}
					}
				});
			}
			else{
				connection.query('INSERT INTO USERS VALUES(?,?,?)',[googleID,"test","test"],
			    function(err, results, fields) {
			      if (err) {
			        res.sendStatus(400);
			      }
						else {
							try {
								let failed = false
								for (let eventObject of events){
									connection.query('INSERT INTO EVENTS VALUES(?,?,?,?,?,?)',[googleID,uuidv1(),eventObject.summary,eventObject.location,dateToDay(eventObject.start.dateTime), dateToUnix(eventObject.start.dateTime)],
							    function(err, results, fields) {
										if (err) {
											failed = true;
										}
									});
								}
								if (failed){
									res.sendStatus(400);
								}
								else {
									res.sendStatus(200)
								}
							} catch (err) {
								res.sendStatus(400)
							}
						}
					}
				);
			}
		}
	else {
		res.sendStatus(400)
	}
}

function dateToDay(isoDate){
	const date = new Date(isoDate)
	return date.getDay();
}

function dateToUnix(isoDate){
	const date = new Date(isoDate)
	return date.getTime();
}
