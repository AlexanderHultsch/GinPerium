// Admin-Seite: Gin-Verwaltung (Anlegen/Bearbeiten/Löschen) + Nutzerliste.
const GIN_FIELDS = ['name', 'image', 'region', 'taste', 'alcohol', 'cost', 'category', 'botanicals', 'story', 'perfectServe'];

let editingGinId = null;

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function readForm(form) {
  const payload = {};
  for (const field of GIN_FIELDS) {
    payload[field] = form.elements[field].value;
  }
  return payload;
}

function fillForm(form, gin) {
  for (const field of GIN_FIELDS) {
    form.elements[field].value = gin[field] ?? '';
  }
}

function showMessage(text, kind) {
  const el = document.getElementById('gin-form-message');
  el.textContent = text;
  el.className = `form-message ${kind}`;
}

async function loadGins() {
  const gins = await api.get('/api/gins');
  const tbody = document.getElementById('gin-table-body');
  tbody.innerHTML = gins.map((gin) => `
    <tr>
      <td>${escapeHtml(gin.name)}</td>
      <td>${escapeHtml(gin.region)}</td>
      <td>${gin.ratingCount}</td>
      <td>
        <button data-action="edit" data-id="${gin.id}">Bearbeiten</button>
        <button data-action="delete" data-id="${gin.id}">Löschen</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4">Noch keine Gins vorhanden.</td></tr>';

  tbody.querySelectorAll('button[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => {
      const gin = gins.find((g) => g.id === button.dataset.id);
      editingGinId = gin.id;
      fillForm(document.getElementById('gin-form'), gin);
      document.getElementById('gin-form-title').textContent = `Gin bearbeiten: ${gin.name}`;
      document.getElementById('gin-form-submit').textContent = 'Änderungen speichern';
      document.getElementById('gin-form-cancel').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  tbody.querySelectorAll('button[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Diesen Gin wirklich löschen? Alle Bewertungen gehen dabei verloren.')) {
        return;
      }
      await api.delete(`/api/admin/gins/${button.dataset.id}`);
      await loadGins();
    });
  });
}

async function loadUsers(currentUserId) {
  const users = await api.get('/api/admin/users');
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = users.map((user) => `
    <tr>
      <td>${escapeHtml(user.username)}</td>
      <td>${user.isAdmin ? 'Ja' : 'Nein'}</td>
      <td>
        ${user.id === currentUserId ? '' : `<button data-action="delete-user" data-id="${user.id}">Löschen</button>`}
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('button[data-action="delete-user"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Diesen Nutzer wirklich löschen?')) {
        return;
      }
      await api.delete(`/api/admin/users/${button.dataset.id}`);
      await loadUsers(currentUserId);
    });
  });
}

function resetForm() {
  editingGinId = null;
  document.getElementById('gin-form').reset();
  document.getElementById('gin-form-title').textContent = 'Neuen Gin anlegen';
  document.getElementById('gin-form-submit').textContent = 'Gin anlegen';
  document.getElementById('gin-form-cancel').classList.add('hidden');
}

async function init() {
  let me;
  try {
    me = await api.get('/api/auth/me');
  } catch {
    window.location.href = 'login.html';
    return;
  }
  if (!me.isAdmin) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('logout-button').addEventListener('click', async () => {
    await api.post('/api/auth/logout');
    window.location.href = 'login.html';
  });

  const form = document.getElementById('gin-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readForm(form);

    try {
      if (editingGinId) {
        await api.put(`/api/admin/gins/${editingGinId}`, payload);
        showMessage('Gin aktualisiert.', 'success');
      } else {
        await api.post('/api/admin/gins', payload);
        showMessage('Gin angelegt.', 'success');
      }
      resetForm();
      await loadGins();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  });

  document.getElementById('gin-form-cancel').addEventListener('click', resetForm);

  await loadGins();
  await loadUsers(me.id);
}

document.addEventListener('DOMContentLoaded', init);
