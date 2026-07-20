// Gemeinsame Hamburger-Navigation für index.html, admin.html, datenschutz.html.
// Rein visuell + generisches Auf-/Zuklappen; seitenspezifische Klicks (Login,
// Logout, …) verdrahtet jede Seite selbst über die data-nav-Attribute — nav.js
// kennt die konkreten Aktionen absichtlich nicht, damit die Seiten unabhängig bleiben.
import { LOGO_SRC, SITE_NAME } from './config.js';

// Usernamen sind nur auf Länge geprüft (routes/auth.js), nicht auf Zeichen —
// ungeschützt in innerHTML eingesetzt wäre das Stored-Self-XSS.
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// active: 'catalog' | 'admin' | 'info' — welcher Menüpunkt als "aktuelle Seite"
// markiert wird (kein Router: die Seiten sind getrennte HTML-Dateien).
// user: eingeloggter Benutzername oder null. isAdmin: nur dann Admin-Menüpunkt.
export function renderNavHtml({ active, user, isAdmin = false }) {
  const markActive = (key) => (key === active ? 'active' : '');
  return `
    <nav class="topnav">
      <a class="brand" href="index.html">
        <img class="brand-icon" src="${LOGO_SRC}" alt="${esc(SITE_NAME)}">
        ${esc(SITE_NAME)}
      </a>
      <button type="button" class="hamburger" id="nav-toggle" aria-label="Menü" aria-expanded="false">☰</button>
      <div class="nav-menu hidden" id="nav-menu">
        ${user ? `<span class="nav-user">👤 ${esc(user)}</span>` : ''}
        <a class="nav-item ${markActive('catalog')}" href="index.html">Katalog</a>
        ${isAdmin ? `<a class="nav-item ${markActive('admin')}" href="admin.html">⚙️ Admin</a>` : ''}
        <a class="nav-item ${markActive('info')}" href="datenschutz.html">ℹ️ Info &amp; Datenschutz</a>
        ${
          user
            ? `<button type="button" class="nav-item" data-nav="logout">Logout</button>`
            : `<button type="button" class="nav-item" data-nav="login">Anmelden</button>`
        }
      </div>
    </nav>`;
}

// Generisches Auf-/Zuklappen + Klick-außerhalb-schließt. Muss nach jedem Neu-
// Rendern des Nav-HTML erneut aufgerufen werden. Der document-Listener wird
// dabei erst wieder ENTFERNT, damit sich bei wiederholtem Rendern nicht mit
// jeder Interaktion weitere document-Click-Listener ansammeln (Leck).
let outsideClickHandler = null;

export function wireNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !willOpen);
    toggle.setAttribute('aria-expanded', String(willOpen));
  });

  if (outsideClickHandler) document.removeEventListener('click', outsideClickHandler);
  outsideClickHandler = (e) => {
    if (!menu.classList.contains('hidden') && e.target !== toggle && !menu.contains(e.target)) {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    }
  };
  document.addEventListener('click', outsideClickHandler);
}
