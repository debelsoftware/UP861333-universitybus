const host = "https://unibusapi.live"
const token = sessionStorage.getItem('token');

if (token == null || token == "null") {
  window.location = '../'
}
