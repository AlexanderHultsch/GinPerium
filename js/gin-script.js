// Filterfunktion
function filterGins() {
  // Wert aus den Dropdown-Menüs auslesen
  const selectedRegion = document.getElementById('RegionSelect').value;
  const selectedTaste = document.getElementById('TasteSelect').value;
  const selectedBotanical = document.getElementById('BotanicalSelect').value;

  const ginContainers = document.getElementsByClassName('GinContainer');

  for (let i = 0; i < ginContainers.length; i++) {
    const currentRegion = ginContainers[i].querySelector('.Region').textContent.trim();
    const currentTaste = ginContainers[i].querySelector('.Taste').textContent.trim();
    const currentBotanicals = ginContainers[i].querySelector('.Botanicals').textContent.trim();

    let showGinContainer = true;
    if (selectedRegion !== 'keine Präferenz' && !currentRegion.includes(selectedRegion)) {
      showGinContainer = false;
    }
    if (selectedTaste !== 'keine Präferenz' && currentTaste !== selectedTaste) {
      showGinContainer = false;
    }
    if (selectedBotanical !== 'keine Präferenz' && !currentBotanicals.includes(selectedBotanical)) {
      showGinContainer = false;
    }

    ginContainers[i].style.display = showGinContainer ? 'flex' : 'none';
  }
}

// Sterne-Bewertung initialisieren: Klick auf einen Stern wählt die Bewertung
// aus, gesendet wird sie erst über den "Bewerten"-Button.
function initializeStarRatings() {
  const starContainers = document.querySelectorAll('.stars');

  starContainers.forEach((container) => {
    const rating = parseInt(container.dataset.rating, 10);
    const stars = container.querySelectorAll('.star');

    const paintStars = (value) => {
      stars.forEach((s) => {
        s.textContent = parseInt(s.dataset.value, 10) <= value ? '★' : '☆';
      });
    };

    paintStars(rating);

    stars.forEach((star) => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value, 10);
        const form = container.parentNode.querySelector('.rating-form');

        paintStars(value);
        container.dataset.rating = value;

        if (form) {
          form.querySelector('input[name="rating"]').value = value;
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('SearchButton')?.addEventListener('click', filterGins);

  initializeStarRatings();
});
