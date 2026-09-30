window.EC_UI = window.EC_UI || {};

function setMobileNavigation(open) {
  const isOpen = Boolean(open);
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menuButton');
  const navBackdrop = document.getElementById('navBackdrop');
  sidebar.classList.toggle('open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  navBackdrop.hidden = !isOpen;
  document.body.classList.toggle('navigation-open', isOpen);
  return isOpen;
}

function initializeMobileNavigation() {
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menuButton');
  const navBackdrop = document.getElementById('navBackdrop');
  const tablet = window.matchMedia('(max-width:1050px)');
  menuButton.addEventListener('click', () => setMobileNavigation(!sidebar.classList.contains('open')));
  navBackdrop.addEventListener('click', () => setMobileNavigation(false));
  sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMobileNavigation(false)));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar.classList.contains('open')) {
      setMobileNavigation(false);
      menuButton.focus();
    }
  });
  tablet.addEventListener?.('change', () => setMobileNavigation(false));
}

window.EC_UI.setMobileNavigation = setMobileNavigation;
window.EC_UI.initializeMobileNavigation = initializeMobileNavigation;
