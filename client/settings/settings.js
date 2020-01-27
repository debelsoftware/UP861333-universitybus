window.addEventListener('load', init)
document.getElementById('delete-button').addEventListener('click', deleteAccount);

function init(){
}

// sends a request to delete the account currently signed in
function deleteAccount(){
  if (confirm("You are about to delete your account and all the data on it, are you sure you want to do this?")) {
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
