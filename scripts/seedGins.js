'use strict';

// Schreibt den ursprünglichen Gin-Katalog (db/seedData.js) in die
// Datenbank. Bereits vorhandene Gins (gleicher Name) werden übersprungen,
// damit spätere Änderungen über die Admin-Oberfläche nicht überschrieben
// werden. Nützlich, um den Katalog nachträglich manuell zu (re-)seeden.
//
// Verwendung: node scripts/seedGins.js

const { openDatabase } = require('../db');
const { createRepository } = require('../db/repository');
const { GIN_SEED } = require('../db/seedData');
const { newId } = require('../lib/ids');
const { nowIso } = require('../lib/time');

const DB_PATH = process.env.DB_PATH ?? '/data/ginperium.sqlite';

function main() {
    const db = openDatabase(DB_PATH);
    const repo = createRepository(db);

    let created = 0;
    let skipped = 0;

    for (const gin of GIN_SEED) {
        if (repo.findGinByName(gin.name)) {
            skipped += 1;
            continue;
        }
        const timestamp = nowIso();
        repo.createGin({ id: newId(), ...gin, createdAt: timestamp, updatedAt: timestamp });
        created += 1;
    }

    console.log(`${created} Gin(s) angelegt, ${skipped} bereits vorhanden übersprungen.`);
    db.close();
}

main();
