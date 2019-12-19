window.addEventListener('load', getTimes)
let stopID = "2";

function getTimes(){
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
    console.log('Fetch Error :-S', err);
  });
}

async function populateTimes(data){
  const times = filterRemaining(data);
  let first = true
  for (let time of times){
     const div = document.createElement('div');
     const busTime = document.createElement('h2');
     const lateness = document.createElement('h2');
     const img = document.createElement('img');
     busTime.textContent = time
     if (first) {
       fetch(`https://unibusapi.live/delay?stop=${stopID}`)
       .then(
         function(response) {
           if (response.status !== 200) {
             console.log('Error' + response.status);
             return;
           }
           response.json().then(function(data) {
             lateness.textContent = data.eta + " Mins Late"
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
       lateness.textContent = "On Time"
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
  console.log(currentTimeConverted.getTime()/1000);
  let remaining = [];
  for (let index = 0; index < data.length; index++){
    var converted = new Date(Date.UTC('1970','01','01', data[index].substr(0, 2),data[index].substr(2, 2),'00'));
    if((converted.getTime()/1000) > currentTimeConverted.getTime()/1000){
      remaining.push(data[index])
    };
  }
  return remaining;
}
