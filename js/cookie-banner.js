// Cookie-Banner: zeigt den Hinweis nur, solange keine Wahl gespeichert ist,
// und merkt sich die Entscheidung dauerhaft im Browser.
document.addEventListener('DOMContentLoaded', function () {
  const banner = document.getElementById('cookie-banner');
  if (!banner) {
    return;
  }

  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    banner.style.display = 'block';
  }

  const accept = document.getElementById('accept-cookies');
  const decline = document.getElementById('decline-cookies');

  accept?.addEventListener('click', function (event) {
    event.preventDefault();
    localStorage.setItem('cookieConsent', 'accepted');
    banner.style.display = 'none';
  });

  decline?.addEventListener('click', function (event) {
    event.preventDefault();
    localStorage.setItem('cookieConsent', 'declined');
    banner.style.display = 'none';
  });
});
