// ============================================================================
// SICHTBARE TEXTE & MARKE — hier ändern, nicht im übrigen Code suchen.
// Wird von public/index.html, public/admin.html und public/datenschutz.html
// importiert (über nav.js / catalog.js / admin.js).
// ============================================================================

export const SITE_NAME = 'Ginperium';
export const SITE_TAGLINE = 'Eine private Gin-Sammlung zum Entdecken und Bewerten.';

// Logo als Bild (kein Emoji). Wird als <img class="brand-icon"> gerendert.
export const LOGO_SRC = 'images/GinIcon.png';

export const NO_PREFERENCE = 'keine Präferenz';

// Sortier-Optionen für den Katalog (siehe filters.js#sortGins).
export const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'rating', label: 'Bewertung (beste zuerst)' },
  { value: 'price', label: 'Preis (günstig zuerst)' },
  { value: 'abv', label: 'Alkoholgehalt (niedrig zuerst)' },
];
