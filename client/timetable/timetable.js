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
      switch(userEvent.day){
        case "1":
          document.getElementById("monday").innerHTML += `<div class="card"><h1>${unixToTime(userEvent.startTime)}</h1><h3>${userEvent.name}</h3><h4>${userEvent.location}</h4></div><br>`
          break
        case "2":
          document.getElementById("tuesday").innerHTML += `<div class="card"><h1>${unixToTime(userEvent.startTime)}</h1><h3>${userEvent.name}</h3><h4>${userEvent.location}</h4></div><br>`
          break
        case "3":
          document.getElementById("wednesday").innerHTML += `<div class="card"><h1>${unixToTime(userEvent.startTime)}</h1><h3>${userEvent.name}</h3><h4>${userEvent.location}</h4></div><br>`
          break
        case "4":
          document.getElementById("thursday").innerHTML += `<div class="card"><h1>${unixToTime(userEvent.startTime)}</h1><h3>${userEvent.name}</h3><h4>${userEvent.location}</h4></div><br>`
          break
        case "5":
          document.getElementById("friday").innerHTML += `<div class="card"><h1>${unixToTime(userEvent.startTime)}</h1><h3>${userEvent.name}</h3><h4>${userEvent.location}</h4></div><br>`
          break
      }
    }
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
