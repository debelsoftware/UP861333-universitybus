let eventsArray = [[],[],[],[],[]]

window.addEventListener('load', init)
document.getElementById('close').addEventListener('click', closeEvent)

function init(){
  getEvents()
}

//closes the opened event
function closeEvent(){
  document.getElementById('loading').style.display = "block"
  document.getElementById('selected').style.display = "none"
  document.getElementById('backdrop').style.display = "none";
}

// gets best bus from server and displays it to the user
function selectEvent(time,location){
  let token = sessionStorage.getItem('token');
  document.getElementById('backdrop').style.display = "block";
  document.getElementById('loading').style.display = "block"
  document.getElementById('selected').style.display = "none"
  fetch(host+"/eventbus", {
    method: 'POST',
    body: JSON.stringify({
      "token": token,
      "startTime": time,
	    "location": location
    }),
    headers:{
      'Content-Type': 'application/json'
    }
  }).then(function(response) {
    if (response.status == 200){
      return response.json();
    }
    else {
      alert("failed to get bus times")
    }
  })
  .then(function(jsonResponse) {
    document.getElementById('selected').style.display = "block"
    document.getElementById('loading').style.display = "none";
    document.getElementById('offTime').textContent = jsonResponse.arriveTime;
    document.getElementById('endStop').textContent = jsonResponse.arriveStop;
    document.getElementById('onTime').textContent = jsonResponse.departTime;
    document.getElementById('departStop').textContent = (jsonResponse.departStop + " (Home)");
    document.getElementById('destination').textContent = location;
    document.getElementById('arrivalTime').textContent = unixToTime(time);
  })
  .catch(error => alert("An error occured while finding a bus time"));
}

// gets users events from the database
function getEvents(){
  let main = document.getElementById('main');
  let token = sessionStorage.getItem('token');
  fetch(host+"/timetable", {
    method: 'POST',
    body: JSON.stringify({
      "token": token
    }),
    headers:{
      'Content-Type': 'application/json'
    }
  }).then(function(response) {
    if (response.status == 200){
      return response.json();
    }
    else {
      alert("failed to get timetable")
    }
  })
  .then(function(jsonResponse) {
    for (let userEvent of jsonResponse){
      eventsArray[parseInt(userEvent.day)-1].push(userEvent)
    }
    populateEvents();
  })
  .catch(error => alert("An error occured while getting your timetable"));
}

// Converts unix timestamp to 24 hour time
function unixToTime(unix){
  const time = new Date(unix)
  const hours = leadingZeros(time.getHours());
  const minutes = leadingZeros(time.getMinutes())
  return `${hours}${minutes}`
}

// Adds leading zeros to the hours and minutes
function leadingZeros(number){
  if (number < 10) {
    number = "0" + number;
  }
  return number;
}

//creates the event card to be displayed on the app
function createEventCard(day,eventIndex){
  let card = document.createElement('div');
  let eventTime = document.createElement('h1')
  let eventName = document.createElement('h3')
  let eventLocation = document.createElement('h4')
  card.classList.add("card");
  eventTime.textContent = unixToTime(eventsArray[day][eventIndex].startTime);
  eventName.textContent = eventsArray[day][eventIndex].name;
  eventLocation.textContent = eventsArray[day][eventIndex].location;
  card.appendChild(eventTime);
  card.appendChild(eventName);
  card.appendChild(eventLocation);
  card.addEventListener('click', function(){selectEvent(eventsArray[day][eventIndex].startTime, eventsArray[day][eventIndex].location)})
  return card
}

//adds events to the page
function populateEvents(){
  const daysOfWeek = ["monday","tuesday","wednesday","thursday","friday"];
  for (let day = 0; day < 5; day++){
    if (eventsArray[day].length == 0) {
      document.getElementById(daysOfWeek[day]).innerHTML = "<h4>No Events</h4>";
    }
    else {
      for (let eventIndex = 0; eventIndex < eventsArray[day].length; eventIndex++) {
        document.getElementById(daysOfWeek[day]).appendChild(createEventCard(day,eventIndex));
      }
    }
  }
}
