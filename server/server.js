const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const MBTiles = require('@mapbox/mbtiles');

const privateKey = fs.readFileSync('./sslcert/privkey.pem', 'utf8');
const certificate = fs.readFileSync('./sslcert/cert.pem', 'utf8');
const ca = fs.readFileSync('./sslcert/chain.pem', 'utf8');
const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

let busTimetable = JSON.parse(fs.readFileSync('bustimetable.json'));
let busStops = JSON.parse(fs.readFileSync('busstops.json'));

let gps = {
  lat: 0,
  lon: 0,
  time: 0,
}

let app = express();
app.use(bodyParser.json());

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/gps', logGPS);
app.get('/clear', clearData);
app.get('/gpsdata', showData);
app.get('/times', showTimes);
app.get('/tile/:z/:x/:y.*', showTile);
app.get('/delay', showDelay);

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
		res.send(busTimetable)
	}
	else {
		res.send(busTimetable[req.query.stop])
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
	return ({
		"eta": time,
		"closestStop": busStops.stops[closestStop][0]
	})
}

function closestStopToBus(){
	let shortestDistance = 999999;
	let closestStop;
	let currentGPS = gps
	for (let index = 0; index < busStops.stops.length; index++){
			let distance = distanceBetween2Points(currentGPS.lat, currentGPS.lon, busStops.stops[index][2][0], busStops.stops[index][2][1])
			if (distance < shortestDistance){
				closestStop = index;
				shortestDistance = distance
			}
	}
	return closestStop
}

function distanceBetween2Points(lat1,lon1,lat2,lon2) {
  let earthRadius = 6371;
  let dLat = deg2rad(lat2-lat1);
  let dLon = deg2rad(lon2-lon1);
  let a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  let d = earthRadius * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
