window.addEventListener('load', () => {
  const loader = document.querySelector('.loader-wrapper');
  const mainContent = document.getElementById('main-content');

  setTimeout(() => {
    loader.classList.add('hidden');
    mainContent.classList.remove('hidden');
  }, 3000);
});

window.addEventListener('load', () => {
  const loader = document.querySelector('.status');
  const mainContent = document.getElementById('main-content');

  setTimeout(() => {
    loader.classList.add('hidden');
    mainContent.classList.remove('hidden');
  }, 6000);
});