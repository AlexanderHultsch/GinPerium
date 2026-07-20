// Reine Domänenlogik & Antwort-Shaping. Keine DB, keine Seiteneffekte.

const GIN_TEXT_FIELDS = [
  'name',
  'image',
  'region',
  'taste',
  'alcohol',
  'cost',
  'category',
  'botanicals',
  'story',
  'perfectServe',
];

export function isValidRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validiert ein Gin-Payload-Objekt (aus einer Anfrage).
 * Gibt { valid: true, gin } oder { valid: false, field } zurück.
 * gin enthält die getrimmten Textfelder sowie priceEur/abv/volumeL als Zahlen.
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

  if (body?.volumeL === undefined || body?.volumeL === null || body?.volumeL === '') {
    gin.volumeL = null;
  } else {
    const volumeL = toFiniteNumber(body.volumeL);
    if (volumeL === null || volumeL < 0) return { valid: false, field: 'volumeL' };
    gin.volumeL = volumeL;
  }

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
    cost: row.cost,
    category: row.category,
    botanicals: row.botanicals,
    story: row.story,
    perfectServe: row.perfect_serve,
    priceEur: row.price_eur,
    abv: row.abv,
    volumeL: row.volume_l,
    averageRating: summary ? summary.averageRating : 0,
    ratingCount: summary ? summary.ratingCount : 0,
    ownRating: ownRating ?? null,
  };
}

export function publicAdminUser(user) {
  return { id: user.id, username: user.username, isAdmin: !!user.is_admin, createdAt: user.created_at };
}
