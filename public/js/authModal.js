// Login/Registrierung als Modal-Overlay. Wird bei Bedarf (Klick auf einen
// Stern ohne Login, Klick auf "Anmelden" im Nav) geöffnet.
import { api } from './api.js';

let overlayEl = null;
let keydownHandler = null;

function closeAuthModal() {
  overlayEl?.remove();
  overlayEl = null;
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
}

function renderModal(tab) {
  return `
    <div class="modal-overlay" id="auth-modal-overlay">
      <div class="modal">
        <div class="modal-inner">
          <button type="button" class="modal-close" id="auth-modal-close" aria-label="Schließen">✕</button>
          <div class="modal-tabs">
            <button type="button" class="modal-tab ${tab === 'login' ? 'active' : ''}" data-tab="login">Anmelden</button>
            <button type="button" class="modal-tab ${tab === 'register' ? 'active' : ''}" data-tab="register">Registrieren</button>
          </div>
          <p class="form-message" id="auth-modal-message"></p>
          <form id="auth-modal-form" data-mode="${tab}">
            <div class="field-group">
              <label for="auth-username">Benutzername</label>
              <input type="text" id="auth-username" name="username" required autocomplete="username">
            </div>
            <div class="field-group">
              <label for="auth-password">Passwort</label>
              <input type="password" id="auth-password" name="password" required
                     autocomplete="${tab === 'register' ? 'new-password' : 'current-password'}"
                     ${tab === 'register' ? 'minlength="8"' : ''}>
            </div>
            <button type="submit" class="button-primary" id="auth-modal-submit">
              ${tab === 'register' ? 'Registrieren' : 'Anmelden'}
            </button>
          </form>
        </div>
      </div>
    </div>`;
}

function showMessage(text, kind) {
  const el = document.getElementById('auth-modal-message');
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${kind ?? ''}`;
}

function wireModal(onSuccess) {
  const overlay = document.getElementById('auth-modal-overlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAuthModal();
  });
  document.getElementById('auth-modal-close').addEventListener('click', closeAuthModal);

  document.querySelectorAll('.modal-tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => openAuthModal({ tab: tabBtn.dataset.tab, onSuccess }));
  });

  const form = document.getElementById('auth-modal-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const mode = form.dataset.mode;
    const username = form.username.value;
    const password = form.password.value;
    const submitBtn = document.getElementById('auth-modal-submit');
    submitBtn.disabled = true;

    try {
      if (mode === 'register') {
        await api.register(username, password);
        await api.login(username, password);
      } else {
        await api.login(username, password);
      }
      const me = await api.me();
      closeAuthModal();
      onSuccess?.(me.user);
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

export function openAuthModal({ tab = 'login', onSuccess } = {}) {
  closeAuthModal();
  const wrapper = document.createElement('div');
  wrapper.innerHTML = renderModal(tab);
  overlayEl = wrapper.firstElementChild;
  document.body.appendChild(overlayEl);
  wireModal(onSuccess);
  keydownHandler = (e) => {
    if (e.key === 'Escape') closeAuthModal();
  };
  document.addEventListener('keydown', keydownHandler);
  document.getElementById('auth-username')?.focus();
}

export { closeAuthModal };
