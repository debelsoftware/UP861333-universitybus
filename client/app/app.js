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
       console.log(Math.floor(expectedTime.getTime()/1000));
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
               lateness.textContent = `Expected ${latenessDate.getHours()}${latenessDate.getMinutes()}`
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
    var converted = new Date(Date.UTC('1970','01','01', data[index].substr(0, 2),data[index].substr(2, 2),'00'));
    if((converted.getTime()/1000) > currentTimeConverted.getTime()/1000){
      remaining.push(data[index])
    };
  }
  return remaining;
}
