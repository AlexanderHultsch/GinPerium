// Katalog-Seite: lädt Gins, baut Filter, rendert Karten, verarbeitet Bewertungen.
let allGins = [];

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function regionKey(region) {
  return region.split('/')[0].trim();
}

function buildFilterOptions(gins) {
  const regions = new Set();
  const tastes = new Set();
  const botanicals = new Set();

  for (const gin of gins) {
    regions.add(regionKey(gin.region));
    tastes.add(gin.taste);
    for (const botanical of gin.botanicals.split(',')) {
      const trimmed = botanical.trim();
      if (trimmed) botanicals.add(trimmed);
    }
  }

  return {
    regions: [...regions].sort(),
    tastes: [...tastes].sort(),
    botanicals: [...botanicals].sort(),
  };
}

function fillSelect(select, options) {
  for (const option of options) {
    const el = document.createElement('option');
    el.value = option;
    el.textContent = option;
    select.appendChild(el);
  }
}

function starsMarkup(ginId, average, ownRating) {
  const displayValue = ownRating ?? Math.round(average);
  let html = `<div class="stars" data-gin-id="${ginId}" data-own-rating="${ownRating ?? ''}">`;
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star${i <= displayValue ? ' filled' : ''}" data-value="${i}">★</span>`;
  }
  html += '</div>';
  return html;
}

function ginCardMarkup(gin) {
  return `
    <div class="gin-card" data-name="${escapeHtml(gin.name)}" data-region="${escapeHtml(gin.region)}" data-taste="${escapeHtml(gin.taste)}" data-botanicals="${escapeHtml(gin.botanicals)}">
      <div class="left-column">
        <img src="images/${escapeHtml(gin.image)}" alt="${escapeHtml(gin.name)}">
        <p>${escapeHtml(gin.region)}</p>
        <p>${escapeHtml(gin.taste)}</p>
        <p>${escapeHtml(gin.alcohol)}</p>
        <p>${escapeHtml(gin.cost)}</p>
      </div>
      <div class="right-column">
        <h2 class="gin-name">${escapeHtml(gin.name)}</h2>
        <p class="category">${escapeHtml(gin.category)}</p>
        <p class="botanicals">${escapeHtml(gin.botanicals)}</p>
        <p class="story">${escapeHtml(gin.story)}</p>
        <img class="perfect-serve-icon" src="images/ui/PerfectServe.svg" alt="Perfect Serve">
        <p class="perfect-serve-text">${escapeHtml(gin.perfectServe)}</p>
        <div class="average-rating">
          ${starsMarkup(gin.id, gin.averageRating, gin.ownRating)}
          <p class="rating-count">${gin.ratingCount} Bewertung${gin.ratingCount === 1 ? '' : 'en'}${gin.ownRating ? ` · deine Bewertung: ${gin.ownRating}` : ''}</p>
          <p class="rating-hint">Klicke einen Stern, um zu bewerten</p>
        </div>
      </div>
    </div>
  `;
}

function renderGins(gins) {
  const grid = document.getElementById('gin-grid');
  if (gins.length === 0) {
    grid.innerHTML = '<p class="empty-state">Noch keine Gins in der Sammlung.</p>';
    return;
  }
  grid.innerHTML = gins.map(ginCardMarkup).join('');

  grid.querySelectorAll('.stars').forEach((starsEl) => {
    starsEl.querySelectorAll('.star').forEach((star) => {
      star.addEventListener('click', async () => {
        const ginId = starsEl.dataset.ginId;
        const value = Number(star.dataset.value);

        try {
          await api.put(`/api/gins/${ginId}/rating`, { rating: value });
          await loadGins();
          applyFilters();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  });
}

function applyFilters() {
  const region = document.getElementById('region-select').value;
  const taste = document.getElementById('taste-select').value;
  const botanical = document.getElementById('botanical-select').value;

  document.querySelectorAll('.gin-card').forEach((card) => {
    const matchesRegion = region === 'keine Präferenz' || card.dataset.region.includes(region);
    const matchesTaste = taste === 'keine Präferenz' || card.dataset.taste === taste;
    const matchesBotanical = botanical === 'keine Präferenz' || card.dataset.botanicals.includes(botanical);

    card.style.display = matchesRegion && matchesTaste && matchesBotanical ? 'flex' : 'none';
  });
}

async function loadGins() {
  allGins = await api.get('/api/gins');
  renderGins(allGins);
}

async function init() {
  let me;
  try {
    me = await api.get('/api/auth/me');
  } catch {
    window.location.href = 'login.html';
    return;
  }

  if (me.isAdmin) {
    document.getElementById('admin-link')?.classList.remove('hidden');
  }

  document.getElementById('logout-button')?.addEventListener('click', async () => {
    await api.post('/api/auth/logout');
    window.location.href = 'login.html';
  });

  await loadGins();
  const options = buildFilterOptions(allGins);
  fillSelect(document.getElementById('region-select'), options.regions);
  fillSelect(document.getElementById('taste-select'), options.tastes);
  fillSelect(document.getElementById('botanical-select'), options.botanicals);

  document.getElementById('filter-button').addEventListener('click', applyFilters);
}

document.addEventListener('DOMContentLoaded', init);
