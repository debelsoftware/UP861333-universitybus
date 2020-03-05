//window.addEventListener('load', getBusStops);

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(getBusStops);
} else {
  alert("Location services must be enabled to use this feature");
}

function getBusStops(gps){
  setTimeout(function () {
    fetch(`https://unibusapi.live/times`)
    .then(
      function(response) {
        if (response.status !== 200) {
          console.log('Error' + response.status);
          return;
        }
        response.json().then(function(data) {
          populateStops(assignDistanceAndOrder(data,gps));
        });
      }
    )
    .catch(function(err) {
      alert('Sorry, we were unable to load the bus stops');
    });
  }, 2000);
}

function populateStops(sortedStops){
  const stopList = document.getElementById('main');
  stopList.innerHTML = "<h3>Click a stop to set it as your home stop, or view on the map</h3><br>";
  for (let stop of sortedStops){
    let stopContainer = document.createElement('div');
    stopContainer.classList.add('card');
    let stopName = document.createElement('h3');
    stopName.textContent = `${stop[0]}, ${stop[1].toFixed(2)}KM`;
    stopContainer.appendChild(stopName);
    stopContainer.addEventListener('click', function(){
      showOptions(stop[0],[stop[2][0],stop[2][1]], stop[3])
    })
    stopList.appendChild(stopContainer)
  }
}

function setHomeStop(stop){
  let token = sessionStorage.getItem('token');
  document.getElementById('setStop').disabled = true;
  fetch(host+"/sethome", {
    method: 'POST',
    body: JSON.stringify({
      "token": token,
      "stop": stop
    }),
    headers:{
      'Content-Type': 'application/json'
    }
  }).then(function(response) {
    if (response.status == 200){
      closeOptions();
      alert("Your home stop has been changed")
    }
    else {
      alert("An error occured while setting your home stop");
    }
  })
  .catch(error => alert("An error occured while setting your home stop"));
}

function showOptions(stopName,coords, stopID){
  document.getElementById('selectedStop').textContent = stopName;
  document.getElementById('options').style.display = "block";
  document.getElementById('viewMap').onclick = function(){window.location = `../tracker?lat=${coords[0]}&lon=${coords[1]}`}
  document.getElementById('setStop').disabled = false;
  document.getElementById('setStop').onclick = function(){setHomeStop(stopID)}
}

function closeOptions(){
  document.getElementById('options').style.display = "none";
}

function assignDistanceAndOrder(data,gps){
  let tempStopArray = []
  let stopID = -1;
  for (let stop of data.stops){
    stopID++
    let distance = distanceBetweenPoints(stop[2][0],stop[2][1], gps.coords.latitude, gps.coords.longitude)
    tempStopArray.push([stop[0],distance,stop[2],stopID]);
  }
  return tempStopArray.sort(sortByDistance);
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

function sortByDistance(item1, item2) {
    return item1[1] - item2[1];
}
