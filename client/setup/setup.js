let slide = 1;
let text = document.getElementById('text-content');
let graphic = document.getElementById('graphic');
let nextButton = document.getElementById('next');
let cancelButton = document.getElementById('cancel');
let checkButton;

nextButton.addEventListener('click', nextSlide);
cancelButton.addEventListener('click', cancel);
text.textContent = `Hey ${sessionStorage.getItem('name')}, we have a few things we'd like to configure before starting`

function cancel(){
  window.location = "../"
}

function nextSlide(){
  slide++;
  if (slide==2) {
    nextButton.disabled = true;
    text.textContent = "We use your student timetable to predict bus usage";
    let check = document.createElement("input");
    let label = document.createElement("p");
    let container = document.createElement("div");
    container.id = "checkbox"
    label.textContent = "I agree to share my UoP timetable data";
    check.type = "checkbox";
    check.id = "check";
    checkButton = check;
    container.appendChild(check)
    container.appendChild(label)
    document.getElementById('content').appendChild(container);
    document.getElementById('check').addEventListener("change", acceptToggle);
    nextButton.textContent = "Next"
    graphic.src = "../calendar.gif"
  }
  else if (slide==3){
    document.getElementById('cancel').style.display = "none";
    nextButton.disabled = true;
    nextButton.textContent = "Finish"
    text.textContent = "Just a moment...";
    graphic.src = "../loading.svg"
    graphic.style.width = "100px"
    let explainText = document.createElement("h3");
    explainText.id = "explain-text"
    explainText.textContent = "We're syncing your timetable with our servers."
    document.getElementById('content').appendChild(explainText);
    document.getElementById('checkbox').style.display = "none";
    syncTimetable(false)
  }
  else if (slide==4) {
    window.location.href = "../app";
  }
}

function acceptToggle(){
  if (document.getElementById("check").checked){
    nextButton.disabled = false;
  }
  else {
    nextButton.disabled = true;
  }
}

function syncTimetable(onlysync){
  let events = JSON.parse(sessionStorage.getItem('ttdata'));
  setTimeout(function () {
    fetch(host+"/synctt", {
      method: 'POST',
      body: JSON.stringify({
        "token": sessionStorage.getItem('token'),
        "ttdata": events
      }),
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(function(response) {
      if (response.status == 200){
        graphic.src = "../tick.gif"
        nextButton.disabled = false;
        text.textContent = "All done!";
        document.getElementById("explain-text").textContent = "Setup is complete, you're ready to use the app."
      }
      else {
        graphic.display = "none"
        text.textContent = "Sync failed";
        document.getElementById("explain-text").textContent = "Unfortunetely something went wrong, plese try again later."
      }
    })
    .catch(error => console.log(error));
  }, 3000);
}
