// Einstiegspunkt: DB öffnen, Repository + App verdrahten, lauschen.
import { openDatabase } from './db/index.js';
import { createRepository } from './db/repository.js';
import { seedGinsIfEmpty } from './db/seedData.js';
import { createApp } from './app.js';

const db = openDatabase();
const repo = createRepository(db);

const seeded = seedGinsIfEmpty(repo);
if (seeded > 0) {
  console.log(`Katalog mit ${seeded} Gins aus db/seedData.js befüllt.`);
}

const app = createApp({ repo });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Ginperium läuft auf http://localhost:${PORT}`));
