import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GIN_SEED, seedGinsIfEmpty } from '../db/seedData.js';
import { validateGinPayload } from '../lib/domain.js';
import { openDatabase } from '../db/index.js';
import { createRepository } from '../db/repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('GIN_SEED: Namen sind eindeutig', () => {
  const names = GIN_SEED.map((gin) => gin.name);
  assert.equal(new Set(names).size, names.length);
});

test('GIN_SEED: jeder Eintrag besteht die Feld-Validierung', () => {
  for (const gin of GIN_SEED) {
    const result = validateGinPayload(gin);
    assert.equal(result.valid, true, `Ungültig: ${gin.name} (Feld: ${result.field})`);
  }
});

test('GIN_SEED: priceEur und abv sind plausible Zahlen', () => {
  for (const gin of GIN_SEED) {
    assert.equal(typeof gin.priceEur, 'number');
    assert.ok(gin.priceEur > 0 && gin.priceEur < 200, `${gin.name}: unplausibler Preis ${gin.priceEur}`);
    assert.equal(typeof gin.abv, 'number');
    assert.ok(gin.abv > 0 && gin.abv <= 100, `${gin.name}: unplausibler ABV ${gin.abv}`);
  }
});

test('GIN_SEED: referenzierte Bilddateien existieren unter public/images/', () => {
  for (const gin of GIN_SEED) {
    const filePath = path.join(__dirname, '..', 'public', 'images', gin.image);
    assert.equal(fs.existsSync(filePath), true, `Fehlendes Bild: ${gin.image}`);
  }
});

test('seedGinsIfEmpty befüllt eine leere Datenbank und lässt eine nicht-leere unangetastet', () => {
  const db = openDatabase(':memory:');
  const repo = createRepository(db);

  const firstRun = seedGinsIfEmpty(repo);
  assert.equal(firstRun, GIN_SEED.length);
  assert.equal(repo.listGins().length, GIN_SEED.length);

  const secondRun = seedGinsIfEmpty(repo);
  assert.equal(secondRun, 0);
  assert.equal(repo.listGins().length, GIN_SEED.length);

  db.close();
});
