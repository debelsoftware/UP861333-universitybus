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
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    signInButton.onclick = signInButtonClick;
  }, function(error) {
  });
}

function updateSigninStatus(isSignedIn) {
  loadingImg.style.display = "none";
  signInButton.style.display = "block";
  if (isSignedIn) {
    accountSignedIn = true;
    signInButton.textContent = `Continue as ${profile.getBasicProfile().getEmail()}`
    accountSwitch.style.display = "block";
  }
}

function getTimetableData() {
  let timetableID = "null";
  gapi.client.calendar.calendarList.list().then(function(response) {
    console.log(response.result.items);
    if (response.result.items.length >= 1){
      for (calendar of response.result.items){
        if (calendar.summary == "UoP Timetable"){
          timetableID = calendar.id;
        }
      }
    }
    if (timetableID != "null") {
      gapi.client.calendar.events.list({
        'calendarId': timetableID,
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime'
      }).then(function(response) {
        let events = response.result.items;
      });
      localStorage.setItem('token', token);
      localStorage.setItem('name', profile.getBasicProfile().getGivenName());
      window.location.href = "./setup";
    }
    else {
      alert("Couldn't find your timetable")
      loadingImg.style.display = "none";
      signInButton.style.display = "block";
    }
  });
}
