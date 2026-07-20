// Reine Filter-/Sortierfunktionen für den Katalog — keine DOM-/Netzwerkzugriffe,
// daher ohne Browser per `node --test` testbar (siehe test/filters.test.js).
import { NO_PREFERENCE } from './config.js';

// Erster Teil vor "/" (z.B. "England / London" -> "England") — so wie die
// Region auch als Filteroption angezeigt wird.
export function regionKey(region) {
  return String(region ?? '')
    .split('/')[0]
    .trim();
}

export function botanicalList(botanicals) {
  return String(botanicals ?? '')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
}

// Ermittelt die distinkten Filteroptionen aus der aktuellen Gin-Liste.
export function buildFilterOptions(gins) {
  const regions = new Set();
  const tastes = new Set();
  const botanicals = new Set();

  for (const gin of gins) {
    regions.add(regionKey(gin.region));
    tastes.add(gin.taste);
    for (const b of botanicalList(gin.botanicals)) botanicals.add(b);
  }

  return {
    regions: [...regions].sort((a, b) => a.localeCompare(b, 'de')),
    tastes: [...tastes].sort((a, b) => a.localeCompare(b, 'de')),
    botanicals: [...botanicals].sort((a, b) => a.localeCompare(b, 'de')),
  };
}

export function filterGins(gins, { region, taste, botanical } = {}) {
  return gins.filter((gin) => {
    if (region && region !== NO_PREFERENCE && regionKey(gin.region) !== region) return false;
    if (taste && taste !== NO_PREFERENCE && gin.taste !== taste) return false;
    if (botanical && botanical !== NO_PREFERENCE && !botanicalList(gin.botanicals).includes(botanical)) return false;
    return true;
  });
}

const SORTERS = {
  name: (a, b) => a.name.localeCompare(b.name, 'de'),
  rating: (a, b) => b.averageRating - a.averageRating || a.name.localeCompare(b.name, 'de'),
  price: (a, b) => a.priceEur - b.priceEur || a.name.localeCompare(b.name, 'de'),
  abv: (a, b) => a.abv - b.abv || a.name.localeCompare(b.name, 'de'),
};

export function sortGins(gins, sortKey) {
  const sorter = SORTERS[sortKey] ?? SORTERS.name;
  return [...gins].sort(sorter);
}
