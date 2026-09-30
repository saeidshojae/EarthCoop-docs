window.EC_UI = window.EC_UI || {};

function setTheme(theme) {
  const selected = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = selected;
  localStorage.setItem('ec-theme', selected);
  return selected;
}

function initializeTheme() {
  document.documentElement.dataset.theme = localStorage.getItem('ec-theme') || 'light';
  document.getElementById('themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
}

window.EC_UI.setTheme = setTheme;
window.EC_UI.initializeTheme = initializeTheme;
