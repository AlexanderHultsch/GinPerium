// Login- und Registrierungs-Formulare per fetch gegen die API senden.
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const messageEl = document.getElementById('form-message');

  function showMessage(text, kind) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = `form-message ${kind}`;
  }

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    try {
      await api.post('/api/auth/login', { username, password });
      window.location.href = 'index.html';
    } catch (err) {
      showMessage(err.message, 'error');
    }
  });

  registerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = registerForm.username.value;
    const password = registerForm.password.value;

    try {
      await api.post('/api/auth/register', { username, password });
      showMessage('Registrierung erfolgreich, du kannst dich jetzt anmelden.', 'success');
      registerForm.reset();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  });
});
