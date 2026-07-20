// Kleine, wiederverwendbare Statusmeldung außerhalb von Formularen (z.B. beim
// Bewerten oder beim Umschalten von Vorrätig/Sichtbar in der Admin-Tabelle),
// wo ein natives alert() ein Stilbruch wäre und den Rest der Seite blockiert.
let toastEl = null;
let hideTimer = null;

export function showToast(message, kind = 'error') {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.className = `toast toast-${kind} visible`;

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 4000);
}
