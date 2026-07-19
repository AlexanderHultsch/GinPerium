'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { GIN_SEED, seedGinsIfEmpty } = require('../db/seedData');
const { validateGinPayload } = require('../lib/domain');
const { openDatabase } = require('../db');
const { createRepository } = require('../db/repository');

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
