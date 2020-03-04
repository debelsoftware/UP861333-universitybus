let CLIENT_ID = '868028424466-1c3gfknc5gtqecdig25d7cpv3rhjpc1e.apps.googleusercontent.com';
let API_KEY = 'AIzaSyDO1UNckpCm6YW-i55jxOpATk_VmjHXczc';
let SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
let signInButton = document.getElementById('login');
let loadingImg = document.getElementById('loading');
let accountSwitch = document.getElementById('switch');
accountSwitch.addEventListener("click", changeAccount)
let profile;
let token;
let accountSignedIn = false;
const host = "https://unibusapi.live"

function pageLoad() {
  gapi.load('client:auth2', initClient);
}

function changeAccount(event) {
  gapi.auth2.getAuthInstance().signOut();
  location.reload();
}

function signInButtonClick(event) {
  if (accountSignedIn){
    getTimetableData();
  }
  else {
    signInButton.style.display = "none";
    loadingImg.style.display = "block";
    gapi.auth2.getAuthInstance().signIn().then(function () {
      profile = gapi.auth2.getAuthInstance().currentUser.get();
      token = profile.getAuthResponse().id_token;
      getTimetableData();
    });
  }
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    profile = gapi.auth2.getAuthInstance().currentUser.get()
    token = profile.getAuthResponse().id_token
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get(), true);
    signInButton.onclick = signInButtonClick;
  }, function(error) {
  });
}

function updateSigninStatus(isSignedIn, auto=false) {
  if (!isSignedIn) {
    loadingImg.style.display = "none";
    signInButton.style.display = "block";
  }
  if (isSignedIn && auto) {
    loadingImg.style.display = "none";
    signInButton.style.display = "block";
    accountSignedIn = true;
    signInButton.textContent = `Continue as ${profile.getBasicProfile().getEmail()}`
    accountSwitch.style.display = "block";
  }
}

function getTimetableData() {
  let timetableID = "null";
  gapi.client.calendar.calendarList.list().then(function(response) {
    if (response.result.items.length >= 1){
      for (calendar of response.result.items){
        if (calendar.summary == "UoP Timetable"){
          timetableID = calendar.id;
        }
      }
    }
    if (timetableID != "null") {
      const weekRange = getWeekRange()
      console.log(weekRange.startWeek);
      console.log(weekRange.endWeek);
      gapi.client.calendar.events.list({
        'calendarId': timetableID,
        'timeMin': weekRange.startWeek,
        'timeMax': weekRange.endWeek,
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 20,
        'orderBy': 'startTime'
      }).then(function(response) {
        let events = response.result.items;
        console.log(events);
        fetch(host+"/userstatus", {
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
            console.log("error");
          }
        })
        .then(function(jsonResponse) {
          sessionStorage.setItem('ttdata', JSON.stringify(events));
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('name', profile.getBasicProfile().getGivenName());
          if (jsonResponse.userRegistered == false){
            window.location.href = "./setup";
          }
          else {
            fetch(host+"/synctt", {
              method: 'POST',
              body: JSON.stringify({
                "token": token,
                "ttdata": events
              }),
              headers:{
                'Content-Type': 'application/json'
              }
            }).then(function(response) {
              if (response.status == 200){
                window.location.href = "./app"
              }
              else {
                alert("An error occured while syncing your timetable");
              }
            })
            .catch(error => alert("An error occured while syncing your timetable"));
          }
        })
        .catch(error => alert("An error occured while getting your details"));
      });
    }
    else {
      alert("Couldn't find your timetable")
      loadingImg.style.display = "none";
      signInButton.style.display = "block";
    }
  });
}

function getWeekRange(){
  let curr = new Date
  let first = curr.getDate() - curr.getDay() + 1
  let firstDay = new Date(curr.setDate(first))
  let lastDay = new Date(curr.setDate(first + 7))
  firstDay.setHours(00,00,00);
  lastDay.setHours(00,00,00);
  return{
    startWeek: firstDay.toISOString(),
    endWeek: lastDay.toISOString()
  }
}
