let map = L.map('map').setView([50.789910, -1.077576], 13);
const urlParams = new URLSearchParams(window.location.search);

L.tileLayer('https://unibusapi.live/tile/{z}/{x}/{y}.png', {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
  maxZoom: 17,
  minZoom: 14
}).addTo(map);
let busMarker;
let busIcon = L.icon({
    iconUrl: 'busicon.png',
    iconSize: [30, 30]
});
let busStops = [[50.794300, -1.097522],[50.789651, -1.084958],[50.787105, -1.080434],[50.786418, -1.071068],[50.786606, -1.059532],[50.790697, -1.055075],[50.792495, -1.058455],[50.794932, -1.069729],[50.795953, -1.075966],[50.795402, -1.092413]]
busStops.forEach(stop => L.marker(stop).addTo(map));
updateTrack(true);
setInterval(function() {updateTrack(false)}, 5000);
function updateTrack(init){
  fetch('https://unibusapi.live/gpsdata')
  .then(
    function(response) {
      if (response.status !== 200) {
        return;
      }
      response.json().then(function(data) {
        if (init) {
          busMarker = L.marker([data.lat, data.lon],{icon: busIcon}).addTo(map)
        }
        else {
          busMarker.setLatLng([data.lat, data.lon]);
        }

      });
    }
  )
  .catch(function(err) {
    console.log('Fetch Error', err);
  });
}

if (urlParams.get('lat') != null && urlParams.get('lon') != null) {
  map.setView([urlParams.get('lat'), urlParams.get('lon')], 17);
}
