// Récupérer tous les éléments qui ont l'attribut "target-popup"
const openPopupButtons = document.querySelectorAll('[target-popup]');

// Boucle sur chaque élément et ajouter un écouteur d'événement "click"
openPopupButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();

    // Récupérer la valeur de l'attribut "target-popup"
    const popupId = button.getAttribute('target-popup');

    // Récupérer le popup avec l'attribut "popup-id" égal à la valeur de "target-popup"
    const popup = document.querySelector(`[popup-id="${popupId}"]`);

    // Afficher le popup
    popup.style.display = 'block';
  });
});


const popups = document.querySelectorAll('.popup');
const body = document.querySelectorAll('body');

// Boucle sur chaque popup et ajouter un écouteur d'événement "click"
popups.forEach((popup) => {
  popup.addEventListener('click', (event) => {
    // Vérifie si le click est sur le contenu de la popup
    if (!event.target.classList.contains('popup-content')) {
      // Masque le popup
      popup.style.display = 'none';
    }
  });
});

