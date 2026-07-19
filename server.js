'use strict';

const { openDatabase } = require('./db');
const { createApp } = require('./app');
const { createRepository } = require('./db/repository');
const { seedGinsIfEmpty } = require('./db/seedData');

const DB_PATH = process.env.DB_PATH ?? '/data/ginperium.sqlite';
const PORT = Number(process.env.PORT ?? 3000);

const db = openDatabase(DB_PATH);

const seeded = seedGinsIfEmpty(createRepository(db));
if (seeded > 0) {
    console.log(`Katalog mit ${seeded} Gins aus db/seedData.js befüllt.`);
}

const app = createApp(db);

app.listen(PORT, () => {
    console.log(`GinPerium läuft auf Port ${PORT} (Datenbank: ${DB_PATH})`);
});
