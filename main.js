// Récupère tous les éléments de film
const films = document.querySelectorAll('.film');

// Pour chaque élément de film
films.forEach(film => {
  // Récupère le titre du film
  const titre = film.querySelector('h3 a').textContent;
  // Récupère l'URL du film
  const url = film.querySelector('h3 a').getAttribute('href');

  // Ajoute l'attribut title au film
  film.setAttribute('title', titre);

  // Ajoute un événement de clic sur l'élément de film
  film.addEventListener('click', () => {
    // Redirige vers la page du film
    window.location.href = url;
  });
});


window.addEventListener('scroll', () => {
  const banner = document.getElementById('banner');
  const bannerImg = document.getElementById('banner-img');
  const scrollTop = window.scrollY || document.documentElement.scrollTop;   // Get scroll position

  if (scrollTop > 40) {
    banner.style.height = '80px';
    bannerImg.style.height = '50px';
  } else {
    banner.style.height = '200px';
    bannerImg.style.height = '120px';
  }
});
