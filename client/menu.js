let menuOpen = false;
const mobileNav = document.getElementById('mobile-nav')
document.getElementById('menu-button').addEventListener("click", toggleMenu);

function toggleMenu(){
  if (menuOpen) {
    mobileNav.style.display = "none"
    menuOpen = false;
  }
  else {
    mobileNav.style.display = "block"
    menuOpen = true;
  }
}
