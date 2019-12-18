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

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/gps', logGPS);
app.get('/clear', clearData);
app.get('/gpsdata', showData);
app.get('/tile/:z/:x/:y.*', showTile);

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

/*
IMPLEMENT ON WEDNESDAY

Set up database and add bus timetable:
you know how :)

PLAN FOR LATENESS:
database table of stops contains time to travel to next stop.
when the client wants time remaining it sends the stop id and the time of the arrival they want to check the server.
the server will go through the values adding up the time between the closest stop to the bus and each stop until it reaches the inteded stop.
duration of that journey is added to the current time.
if the total time is signifcantly higher than the planned time, report running late.
can also be hooked up to a traffic api to add multiplier to duration if traffic is bad.

IF TIME:
add getting bus times from the database so the client is no longer fake.
*/
