import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidRating, validateGinPayload, formatCost, GIN_FIELD_LABELS } from '../lib/domain.js';

test('isValidRating akzeptiert 1 bis 5', () => {
  for (const value of [1, 2, 3, 4, 5]) assert.equal(isValidRating(value), true);
});

test('isValidRating lehnt 0, 6, Kommazahlen und NaN ab', () => {
  for (const value of [0, 6, 3.5, NaN, -1]) assert.equal(isValidRating(value), false);
});

test('formatCost kombiniert Preis und Menge zu einem Anzeige-Text', () => {
  assert.equal(formatCost(26.9, 0.7), '26,90 € für 0,7 l');
  assert.equal(formatCost(5, 1), '5,00 € für 1 l');
});

const VALID_GIN = {
  name: 'Bombay Sapphire',
  image: 'gins/Bombay.jpg',
  region: 'England',
  taste: 'Zitrus',
  alcohol: '40%',
  abv: 40,
  priceEur: 26.9,
  volumeL: 0.7,
  category: 'London Dry Gin',
  botanicals: 'Wacholder, Zitrone',
  story: 'Klassiker.',
  perfectServe: 'Mit Tonic',
};

test('validateGinPayload akzeptiert ein vollständiges Payload', () => {
  const result = validateGinPayload(VALID_GIN);
  assert.equal(result.valid, true);
  assert.equal(result.gin.name, 'Bombay Sapphire');
  assert.equal(result.gin.priceEur, 26.9);
  assert.equal(result.gin.abv, 40);
  assert.equal(result.gin.volumeL, 0.7);
  assert.equal(result.gin.inStock, true);
  assert.equal(result.gin.isVisible, true);
});

test('validateGinPayload übernimmt explizite inStock/isVisible-Werte', () => {
  const result = validateGinPayload({ ...VALID_GIN, inStock: false, isVisible: false });
  assert.equal(result.valid, true);
  assert.equal(result.gin.inStock, false);
  assert.equal(result.gin.isVisible, false);
});

test('validateGinPayload lehnt fehlendes/ungültiges volumeL ab', () => {
  const { volumeL: _volumeL, ...rest } = VALID_GIN;
  assert.equal(validateGinPayload(rest).valid, false);
  assert.equal(validateGinPayload({ ...VALID_GIN, volumeL: 0 }).valid, false);
  assert.equal(validateGinPayload({ ...VALID_GIN, volumeL: -1 }).valid, false);
});

test('validateGinPayload lehnt fehlende Textfelder ab', () => {
  const { name: _name, ...rest } = VALID_GIN;
  const result = validateGinPayload(rest);
  assert.equal(result.valid, false);
  assert.equal(result.field, 'name');
});

test('validateGinPayload trimmt Whitespace und lehnt reine Leerzeichen ab', () => {
  const result = validateGinPayload({ ...VALID_GIN, name: '   ' });
  assert.equal(result.valid, false);
  assert.equal(result.field, 'name');
});

test('validateGinPayload lehnt ungültige priceEur/abv ab', () => {
  assert.equal(validateGinPayload({ ...VALID_GIN, priceEur: 'nope' }).valid, false);
  assert.equal(validateGinPayload({ ...VALID_GIN, priceEur: -1 }).valid, false);
  assert.equal(validateGinPayload({ ...VALID_GIN, abv: 101 }).valid, false);
  assert.equal(validateGinPayload({ ...VALID_GIN, abv: -1 }).valid, false);
});

test('validateGinPayload akzeptiert deutsches Komma als Dezimaltrennzeichen', () => {
  const result = validateGinPayload({ ...VALID_GIN, priceEur: '26,90', abv: '40,5', volumeL: '0,7' });
  assert.equal(result.valid, true);
  assert.equal(result.gin.priceEur, 26.9);
  assert.equal(result.gin.abv, 40.5);
  assert.equal(result.gin.volumeL, 0.7);
});

test('GIN_FIELD_LABELS deckt jedes von validateGinPayload gemeldete Feld ab', () => {
  const allFields = [
    'name',
    'image',
    'region',
    'taste',
    'alcohol',
    'category',
    'botanicals',
    'story',
    'perfectServe',
    'priceEur',
    'abv',
    'volumeL',
  ];
  for (const field of allFields) {
    assert.ok(GIN_FIELD_LABELS[field], `Kein sprechendes Label für "${field}"`);
  }
});
