// Sterne-Anzeige & -Interaktion. Reine Markup-Erzeugung hier, DOM-Verdrahtung
// als kleine, gezielt aufrufbare Funktion (kein globaler State).
//
// Sterne sind echte <button>-Elemente (nicht <span>), damit sie per Tastatur
// erreichbar und mit Enter/Leertaste auslösbar sind — nicht nur per Maus/Touch.

export function starsMarkup(gin) {
  const display = gin.ownRating ?? Math.round(gin.averageRating);
  let html = `<div class="stars" data-gin-id="${gin.id}">`;
  for (let i = 1; i <= 5; i++) {
    const label = `Mit ${i} von 5 Sternen bewerten`;
    html += `<button type="button" class="star${i <= display ? ' filled' : ''}" data-value="${i}" aria-label="${label}">★</button>`;
  }
  html += '</div>';
  return html;
}

// Statt eines Textlabels ("deine Bewertung: 4") ein kompaktes Badge mit
// Häkchen-Icon — die eigene Bewertung steckt schon in den gefüllten Sternen,
// das Badge markiert nur zusätzlich "du hast hier schon bewertet".
export function ratingMetaMarkup(gin) {
  const count = gin.ratingCount === 1 ? '1 Bewertung' : `${gin.ratingCount} Bewertungen`;
  const own = gin.ownRating
    ? `<span class="rating-own" role="img" aria-label="Deine Bewertung: ${gin.ownRating} von 5 Sternen" title="Deine Bewertung: ${gin.ownRating} von 5">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M7.5 13.5 3.8 9.8l1.4-1.4 2.3 2.3 6.3-6.3 1.4 1.4z"/></svg>
      </span>`
    : '';
  return `<span class="rating-count">${count}</span>${own}`;
}

/**
 * Verdrahtet ALLE `.stars`-Elemente innerhalb von root — auch als Gast
 * klickbar, damit ein Klick (oder Enter/Leertaste) das Login-Modal auslösen
 * kann. `onRate` entscheidet selbst, ob bewertet oder das Modal geöffnet wird.
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
