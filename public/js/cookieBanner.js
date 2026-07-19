// Cookie-Banner: zeigt den Hinweis nur, solange keine Wahl gespeichert ist,
// und merkt sich die Entscheidung dauerhaft im Browser.
document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('cookie-banner');
  if (!banner) {
    return;
  }

  if (!localStorage.getItem('cookieConsent')) {
    banner.style.display = 'block';
  }

  document.getElementById('accept-cookies')?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.style.display = 'none';
  });

  document.getElementById('decline-cookies')?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'declined');
    banner.style.display = 'none';
  });
});
