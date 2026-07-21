// Reine Domänenlogik & Antwort-Shaping. Keine DB, keine Seiteneffekte.

const GIN_TEXT_FIELDS = [
  'name',
  'image',
  'region',
  'taste',
  'alcohol',
  'category',
  'botanicals',
  'story',
  'perfectServe',
];

// Sprechende Bezeichnungen für Fehlermeldungen — passend zu den Formular-
// Labels in admin.html, statt der internen camelCase-Feldnamen.
export const GIN_FIELD_LABELS = {
  name: 'Name',
  image: 'Bilddatei',
  region: 'Region',
  taste: 'Geschmack',
  alcohol: 'Alkoholgehalt (Text)',
  category: 'Kategorie',
  botanicals: 'Botanicals',
  story: 'Geschichte',
  perfectServe: 'Perfect Serve',
  priceEur: 'Preis in €',
  abv: 'Alkoholgehalt in % (Zahl)',
  volumeL: 'Flaschengröße in Liter',
};

export function isValidRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

// Akzeptiert sowohl "26.90" als auch "26,90" — die restliche Seite zeigt
// Zahlen im deutschen Format an, ein Admin tippt beim Preis erfahrungsgemäß
// eher ein Komma als einen Punkt.
function toFiniteNumber(value) {
  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// "26,90 € für 0,7 l" — Anzeige-String wird aus den numerischen Feldern
// berechnet statt separat gepflegt, damit Preis und Menge nie auseinanderlaufen.
export function formatCost(priceEur, volumeL) {
  const price = priceEur.toFixed(2).replace('.', ',');
  const volume = String(Math.round(volumeL * 100) / 100).replace('.', ',');
  return `${price} € für ${volume} l`;
}

/**
 * Validiert ein Gin-Payload-Objekt (aus einer Anfrage).
 * Gibt { valid: true, gin } oder { valid: false, field } zurück.
 * gin enthält die getrimmten Textfelder sowie priceEur/abv/volumeL als
 * Zahlen und inStock/isVisible als Booleans.
 */
export function validateGinPayload(body) {
  const gin = {};

  for (const field of GIN_TEXT_FIELDS) {
    const value = String(body?.[field] ?? '').trim();
    if (value === '') return { valid: false, field };
    gin[field] = value;
  }

  const priceEur = toFiniteNumber(body?.priceEur);
  if (priceEur === null || priceEur < 0) return { valid: false, field: 'priceEur' };
  gin.priceEur = priceEur;

  const abv = toFiniteNumber(body?.abv);
  if (abv === null || abv < 0 || abv > 100) return { valid: false, field: 'abv' };
  gin.abv = abv;

  const volumeL = toFiniteNumber(body?.volumeL);
  if (volumeL === null || volumeL <= 0) return { valid: false, field: 'volumeL' };
  gin.volumeL = volumeL;

  gin.inStock = body?.inStock === undefined ? true : Boolean(body.inStock);
  gin.isVisible = body?.isVisible === undefined ? true : Boolean(body.isVisible);

  return { valid: true, gin };
}

// --- Antwort-Shaping: DB-Zeilen (snake_case, 0/1) -> JSON-Typen (camelCase, bool) ---

export function publicUser(user) {
  return { id: user.id, username: user.username, isAdmin: !!user.is_admin };
}

export function publicGin(row, summary, ownRating) {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    region: row.region,
    taste: row.taste,
    alcohol: row.alcohol,
    cost: formatCost(row.price_eur, row.volume_l),
    category: row.category,
    botanicals: row.botanicals,
    story: row.story,
    perfectServe: row.perfect_serve,
    priceEur: row.price_eur,
    abv: row.abv,
    volumeL: row.volume_l,
    inStock: !!row.in_stock,
    isVisible: !!row.is_visible,
    averageRating: summary ? summary.averageRating : 0,
    ratingCount: summary ? summary.ratingCount : 0,
    ownRating: ownRating ?? null,
  };
}

export function publicAdminUser(user, ratingCount = 0) {
  return {
    id: user.id,
    username: user.username,
    isAdmin: !!user.is_admin,
    createdAt: user.created_at,
    ratingCount,
  };
}
