window.addEventListener('load', init)
document.getElementById('delete-button').addEventListener('click', deleteAccount);
document.getElementById('sign-out-button').addEventListener('click', signOut);
document.getElementById('change-home-button').addEventListener('click', function(){
  window.location = "../finder"
});

//Gets the information that the page needs to show
function init(){
  let name = sessionStorage.getItem('name');
  document.getElementById('signedInAs').textContent = `Signed in as ${name}`
}


//Signs the user out by clearing the user token gathered at login
function signOut(){
  sessionStorage.setItem('token', null);
  sessionStorage.setItem('name', null);
  window.location = "../"
}

// sends a request to delete the account currently signed in
function deleteAccount(){
  if (confirm("WARNING! You are about to delete your account and all the data on it, are you sure you want to do this?")) {
    let token = sessionStorage.getItem('token');
    fetch(host+"/deleteaccount", {
      method: 'POST',
      body: JSON.stringify({
        "token": token,
      }),
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
      if (response.status == 200){
        window.location = "../"
      }
      else {
        alert("failed to delete account")
      }
    })
    .catch(error => console.log(error));
  }
}
