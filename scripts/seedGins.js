// Schreibt den ursprünglichen Gin-Katalog (db/seedData.js) in die
// Datenbank. Bereits vorhandene Gins (gleicher Name) werden übersprungen,
// damit spätere Änderungen über die Admin-Oberfläche nicht überschrieben
// werden. Nützlich, um den Katalog nachträglich manuell zu (re-)seeden.
//
// Aufruf: npm run seed:gins
import { openDatabase } from '../db/index.js';
import { createRepository } from '../db/repository.js';
import { GIN_SEED } from '../db/seedData.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';

const repo = createRepository(openDatabase());

let created = 0;
let skipped = 0;

for (const gin of GIN_SEED) {
  if (repo.getGinByName(gin.name)) {
    skipped += 1;
    continue;
  }
  const timestamp = nowIso();
  repo.createGin({ id: newId(), ...gin, createdAt: timestamp, updatedAt: timestamp });
  created += 1;
}

console.log(`${created} Gin(s) angelegt, ${skipped} bereits vorhanden übersprungen.`);
