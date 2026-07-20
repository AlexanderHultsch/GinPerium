// Katalogseite (index.html): lädt Gins öffentlich, rendert Nav/Filter/Grid,
// verdrahtet Sortierung, Filterung und Bewertung (inkl. Login-Modal für Gäste).
import { api } from './api.js';
import { renderNavHtml, wireNavToggle } from './nav.js';
import { NO_PREFERENCE, SORT_OPTIONS } from './config.js';
import { buildFilterOptions, filterGins, sortGins } from './filters.js';
import { starsMarkup, ratingMetaMarkup, wireStarClicks } from './ratings.js';
import { openAuthModal } from './authModal.js';

let allGins = [];
let currentUser = null;

const state = { region: NO_PREFERENCE, taste: NO_PREFERENCE, botanical: NO_PREFERENCE, sort: 'name' };

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function renderNav() {
  document.getElementById('nav-root').innerHTML = renderNavHtml({
    active: 'catalog',
    user: currentUser?.username ?? null,
    isAdmin: !!currentUser?.isAdmin,
  });
  wireNavToggle();
  document.querySelector('[data-nav="login"]')?.addEventListener('click', () => {
    openAuthModal({ tab: 'login', onSuccess: onAuthSuccess });
  });
  document.querySelector('[data-nav="logout"]')?.addEventListener('click', async () => {
    await api.logout();
    currentUser = null;
    renderNav();
    renderGrid();
  });
}

function onAuthSuccess(user) {
  currentUser = user;
  renderNav();
  loadCatalog();
}

function fillSelect(select, options, selected) {
  select.innerHTML = `<option value="${NO_PREFERENCE}">${NO_PREFERENCE}</option>`;
  for (const option of options) {
    const el = document.createElement('option');
    el.value = option;
    el.textContent = option;
    if (option === selected) el.selected = true;
    select.appendChild(el);
  }
}

function renderFilterOptions() {
  const options = buildFilterOptions(allGins);
  fillSelect(document.getElementById('region-select'), options.regions, state.region);
  fillSelect(document.getElementById('taste-select'), options.tastes, state.taste);
  fillSelect(document.getElementById('botanical-select'), options.botanicals, state.botanical);

  const sortSelect = document.getElementById('sort-select');
  sortSelect.innerHTML = SORT_OPTIONS.map((o) => `<option value="${o.value}">${o.label}</option>`).join('');
  sortSelect.value = state.sort;
}

function ginCardMarkup(gin) {
  const interactive = !!currentUser;
  return `
    <article class="gin-card${gin.inStock ? '' : ' out-of-stock'}" data-name="${escapeHtml(gin.name)}">
      ${gin.inStock ? '' : '<span class="out-of-stock-badge">Ausverkauft</span>'}
      <div class="gin-card-photo">
        <img src="images/${escapeHtml(gin.image)}" alt="${escapeHtml(gin.name)}" loading="lazy">
      </div>
      <div class="gin-card-body">
        <h2 class="gin-card-name">${escapeHtml(gin.name)}</h2>
        <div class="gin-card-meta">
          <span>${escapeHtml(gin.region)}</span>
          <span>${escapeHtml(gin.category)}</span>
          <span>${escapeHtml(gin.alcohol)}</span>
          <span>${escapeHtml(gin.cost)}</span>
        </div>
        <div class="gin-card-chips">
          ${gin.botanicals
            .split(',')
            .map((b) => b.trim())
            .filter(Boolean)
            .map((b) => `<span class="chip">${escapeHtml(b)}</span>`)
            .join('')}
        </div>
        <p class="gin-card-story" data-collapsed="true">${escapeHtml(gin.story)}</p>
        <button type="button" class="story-toggle" data-action="toggle-story">mehr lesen</button>
        <p class="gin-card-serve">
          <img src="images/ui/PerfectServe.svg" alt="">
          ${escapeHtml(gin.perfectServe)}
        </p>
        <div class="rating-row">
          ${starsMarkup(gin, { interactive })}
          ${ratingMetaMarkup(gin)}
        </div>
      </div>
    </article>`;
}

function wireStoryToggles(root) {
  root.querySelectorAll('[data-action="toggle-story"]').forEach((button) => {
    button.addEventListener('click', () => {
      const story = button.previousElementSibling;
      const collapsed = story.dataset.collapsed !== 'false';
      story.dataset.collapsed = String(!collapsed);
      button.textContent = collapsed ? 'weniger' : 'mehr lesen';
    });
  });
}

async function handleRate(ginId, value) {
  if (!currentUser) {
    openAuthModal({ tab: 'login', onSuccess: (user) => onAuthSuccess(user) });
    return;
  }
  try {
    await api.rateGin(ginId, value);
    await loadCatalog();
  } catch (err) {
    alert(err.message);
  }
}

function renderGrid() {
  const filtered = filterGins(allGins, state);
  const sorted = sortGins(filtered, state.sort);
  const grid = document.getElementById('gin-grid');

  if (allGins.length === 0) {
    grid.innerHTML = '<p class="state-banner">Noch keine Gins in der Sammlung.</p>';
    return;
  }
  if (sorted.length === 0) {
    grid.innerHTML = '<p class="state-banner">Kein Gin passt zu dieser Filterauswahl.</p>';
    return;
  }

  grid.innerHTML = sorted.map(ginCardMarkup).join('');
  wireStarClicks(grid, handleRate);
  wireStoryToggles(grid);
}

function wireToolbar() {
  document.getElementById('region-select').addEventListener('change', (e) => {
    state.region = e.target.value;
    renderGrid();
  });
  document.getElementById('taste-select').addEventListener('change', (e) => {
    state.taste = e.target.value;
    renderGrid();
  });
  document.getElementById('botanical-select').addEventListener('change', (e) => {
    state.botanical = e.target.value;
    renderGrid();
  });
  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderGrid();
  });
  document.getElementById('toolbar-reset').addEventListener('click', () => {
    state.region = NO_PREFERENCE;
    state.taste = NO_PREFERENCE;
    state.botanical = NO_PREFERENCE;
    state.sort = 'name';
    renderFilterOptions();
    renderGrid();
  });
}

async function loadCatalog() {
  const grid = document.getElementById('gin-grid');
  grid.innerHTML = '<p class="state-banner">Lädt …</p>';
  try {
    const data = await api.listGins();
    allGins = data.gins;
    renderFilterOptions();
    renderGrid();
  } catch (err) {
    grid.innerHTML = `<p class="state-banner error">${escapeHtml(err.message)}</p>`;
  }
}

async function init() {
  renderNav();
  wireToolbar();
  await loadCatalog();

  // Login-Status im Hintergrund ermitteln (Katalog ist bereits sichtbar, unabhängig davon).
  try {
    const me = await api.me();
    currentUser = me.user;
    renderNav();
    renderGrid();
  } catch {
    /* nicht eingeloggt — currentUser bleibt null */
  }
}

document.addEventListener('DOMContentLoaded', init);
