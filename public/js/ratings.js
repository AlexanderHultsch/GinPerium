// Sterne-Anzeige & -Interaktion. Reine Markup-Erzeugung hier, DOM-Verdrahtung
// als kleine, gezielt aufrufbare Funktion (kein globaler State).

export function starsMarkup(gin, { interactive }) {
  const display = gin.ownRating ?? Math.round(gin.averageRating);
  let html = `<div class="stars" data-interactive="${interactive}" data-gin-id="${gin.id}">`;
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star${i <= display ? ' filled' : ''}" data-value="${i}">★</span>`;
  }
  html += '</div>';
  return html;
}

export function ratingMetaMarkup(gin) {
  const count = gin.ratingCount === 1 ? '1 Bewertung' : `${gin.ratingCount} Bewertungen`;
  const own = gin.ownRating ? `<span class="rating-own">deine Bewertung: ${gin.ownRating}</span>` : '';
  return `<span class="rating-count">${count}</span>${own}`;
}

/**
 * Verdrahtet ALLE `.stars`-Elemente innerhalb von root — auch als Gast
 * klickbar, damit ein Klick das Login-Modal auslösen kann. `onRate`
 * entscheidet selbst, ob bewertet oder das Modal geöffnet wird.
 * data-interactive steuert nur die Hover-Optik (CSS), nicht die Klickbarkeit.
 */
export function wireStarClicks(root, onRate) {
  root.querySelectorAll('.stars').forEach((starsEl) => {
    starsEl.querySelectorAll('.star').forEach((star) => {
      star.addEventListener('click', () => {
        onRate(starsEl.dataset.ginId, Number(star.dataset.value));
      });
    });
  });
}
