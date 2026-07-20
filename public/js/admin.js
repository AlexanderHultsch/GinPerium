// Verwaltungsseite (admin.html, nur is_admin): Gin-CRUD + Nutzerliste.
import { api } from './api.js';
import { renderNavHtml, wireNavToggle } from './nav.js';

const GIN_FIELDS = [
  'name',
  'image',
  'region',
  'taste',
  'alcohol',
  'abv',
  'cost',
  'priceEur',
  'volumeL',
  'category',
  'botanicals',
  'story',
  'perfectServe',
];

let editingGinId = null;
let currentUser = null;

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
  el.className = `form-message ${kind ?? ''}`;
}

function resetForm() {
  editingGinId = null;
  document.getElementById('gin-form').reset();
  document.getElementById('gin-form-title').textContent = 'Neuen Gin anlegen';
  document.getElementById('gin-form-submit').textContent = 'Gin anlegen';
  document.getElementById('gin-form-cancel').classList.add('hidden');
}

async function loadGins() {
  const { gins } = await api.listGins();
  const tbody = document.getElementById('gin-table-body');
  tbody.innerHTML =
    gins
      .map(
        (gin) => `
      <tr>
        <td>${escapeHtml(gin.name)}</td>
        <td>${escapeHtml(gin.region)}</td>
        <td>${gin.priceEur.toFixed(2)}&nbsp;€</td>
        <td>${gin.abv}&nbsp;%</td>
        <td>${gin.ratingCount}</td>
        <td class="admin-table-actions">
          <button type="button" class="button-secondary" data-action="edit" data-id="${gin.id}">Bearbeiten</button>
          <button type="button" class="button-danger" data-action="delete" data-id="${gin.id}">Löschen</button>
        </td>
      </tr>`,
      )
      .join('') || '<tr><td colspan="6">Noch keine Gins vorhanden.</td></tr>';

  tbody.querySelectorAll('[data-action="edit"]').forEach((button) => {
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

  tbody.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Diesen Gin wirklich löschen? Alle Bewertungen gehen dabei verloren.')) return;
      await api.adminDeleteGin(button.dataset.id);
      await loadGins();
    });
  });
}

async function loadUsers() {
  const { users } = await api.adminListUsers();
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${escapeHtml(user.username)}</td>
      <td>${user.isAdmin ? 'Ja' : 'Nein'}</td>
      <td>${user.id === currentUser.id ? '' : `<button type="button" class="button-danger" data-action="delete-user" data-id="${user.id}">Löschen</button>`}</td>
    </tr>`,
    )
    .join('');

  tbody.querySelectorAll('[data-action="delete-user"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Diesen Nutzer wirklich löschen?')) return;
      await api.adminDeleteUser(button.dataset.id);
      await loadUsers();
    });
  });
}

function renderNav() {
  document.getElementById('nav-root').innerHTML = renderNavHtml({
    active: 'admin',
    user: currentUser?.username ?? null,
    isAdmin: true,
  });
  wireNavToggle();
  document.querySelector('[data-nav="logout"]')?.addEventListener('click', async () => {
    await api.logout();
    window.location.href = 'index.html';
  });
}

async function init() {
  let me;
  try {
    me = (await api.me()).user;
  } catch {
    window.location.href = 'index.html';
    return;
  }
  if (!me.isAdmin) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = me;
  renderNav();

  const form = document.getElementById('gin-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readForm(form);
    try {
      if (editingGinId) {
        await api.adminUpdateGin(editingGinId, payload);
        showMessage('Gin aktualisiert.', 'success');
      } else {
        await api.adminCreateGin(payload);
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
  await loadUsers();
}

document.addEventListener('DOMContentLoaded', init);
