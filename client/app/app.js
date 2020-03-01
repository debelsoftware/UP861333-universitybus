let stopID = "0";

window.addEventListener('load', init)
document.getElementById('stopSelect').addEventListener('change', function(){
  stopID=document.getElementById('stopSelect').value
  getTimes()
})

function init(){
  document.getElementById('stopSelect').value = stopID
  getTimes()
}

function getTimes(){
  document.getElementById('busTimes').innerHTML="<img id='loading' src='../loading.svg'>";
  fetch(`https://unibusapi.live/times?stop=${stopID}`)
  .then(
    function(response) {
      if (response.status !== 200) {
        console.log('Error' + response.status);
        return;
      }
      response.json().then(function(data) {
        populateTimes(data);
      });
    }
  )
  .catch(function(err) {
    alert('Sorry, we were unable to load the timetable');
  });
}

async function populateTimes(data){
  let currentTime = new Date();
  const times = filterRemaining(data);
  let first = true
  document.getElementById('busTimes').innerHTML="";
  for (let time of times){
     const div = document.createElement('div');
     const busTime = document.createElement('h2');
     const lateness = document.createElement('h2');
     const img = document.createElement('img');
     busTime.textContent = time
     if (first) {
       let expectedTime = new Date(Date.UTC(currentTime.getFullYear(),currentTime.getMonth(),currentTime.getDate(), time.substr(0, 2),time.substr(2, 2),'00'))
       img.src = "../loading.svg"
       img.id = "live"
       lateness.appendChild(img)
       fetch(`https://unibusapi.live/delay?stop=${stopID}&eTime=${Math.floor(expectedTime.getTime()/1000)}`)
       .then(
         function(response) {
           if (response.status !== 200) {
             console.log('Error' + response.status);
             return;
           }
           response.json().then(function(data) {
             if (data.status == "Late") {
               let latenessDate = new Date(data.eta*1000)
               lateness.textContent = `Expected ${leadingZeros(latenessDate.getHours())}${leadingZeros(latenessDate.getMinutes())}`
             }
             else {
               lateness.textContent = `On Time`
             }
             img.src = "../live.svg"
             lateness.appendChild(img)
           });
         }
       )
       .catch(function(err) {
         console.log('Fetch Error :-S', err);
       });
     }
     else {
       lateness.textContent = "Info Soon"
     }
     lateness.id = "lateness"
     div.classList.add("card")
     div.appendChild(busTime)
     div.appendChild(lateness)
     document.getElementById('busTimes').appendChild(div)
     first = false;
  }
}

//Filters out all buses that have already passed that day
function filterRemaining(data){
  let time = new Date();
  let currentTimeConverted = new Date(Date.UTC('1970','01','01',time.getHours(),time.getMinutes(),'00'));
  let remaining = [];
  for (let index = 0; index < data.length; index++){
    let converted = new Date(Date.UTC('1970','01','01', data[index].substr(0, 2),data[index].substr(2, 2),'00'));
    if((converted.getTime()/1000) > currentTimeConverted.getTime()/1000){
      remaining.push(data[index])
    };
  }
  return remaining;
}

// Adds leading zeros to the hours and minutes
function leadingZeros(number){
  if (number < 10) {
    number = "0" + number;
  }
  return number;
}

function getDateCode(){
  let currentDate = new Date();
  return currentDate.getDay();
}

fetch(`https://unibusapi.live/busyness?day=${getDateCode()}`)
.then(
  function(response) {
    if (response.status !== 200) {
      console.log('Error' + response.status);
      return;
    }
    response.json().then(function(data) {
      const domGraph = document.getElementById('graph').getContext('2d');
      const graph = new Chart(domGraph, {
          type: 'line',
          data: {
              labels: ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
              datasets: [{
                  label: 'Busyness',
                  data: data,
                  pointRadius: 0,
                  backgroundColor: '#1e8ae8',
                  borderWidth: 0
              }]
          },
          options: {
              scales: {
                  yAxes: [{
                      ticks: {
                          display: false
                      }
                  }]
              }
          }
      });
    });
  }
)
.catch(function(err) {
  console.log('Fetch Error :-S', err);
});
