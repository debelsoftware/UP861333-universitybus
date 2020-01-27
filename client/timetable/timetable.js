let eventsArray = [[],[],[],[],[]]

window.addEventListener('load', init)

function init(){
  getEvents()
}

// gets users events from the database
function getEvents(){
  let main = document.getElementById('main');
  let token = sessionStorage.getItem('token');
  fetch(host+"/timetable", {
    method: 'POST',
    body: JSON.stringify({
      "token": token,
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
    console.log(eventsArray);
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

//adds events to the page
function populateEvents(){
  const daysOfWeek = ["monday","tuesday","wednesday","thursday","friday"];
  for (let day = 0; day < 5; day++){
    if (eventsArray[day].length == 0) {
      document.getElementById(daysOfWeek[day]).innerHTML = "<h4>No Events</h4>";
    }
    else {
      for (let eventIndex = 0; eventIndex < eventsArray[day].length; eventIndex++) {
        document.getElementById(daysOfWeek[day]).innerHTML += `<div class="card"><h1>${unixToTime(eventsArray[day][eventIndex].startTime)}</h1><h3>${eventsArray[day][eventIndex].name}</h3><h4>${eventsArray[day][eventIndex].location}</h4></div>`;
      }
    }
  }
}
