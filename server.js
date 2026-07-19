'use strict';

const { openDatabase } = require('./db');
const { createApp } = require('./app');

const DB_PATH = process.env.DB_PATH ?? '/data/ginperium.sqlite';
const PORT = Number(process.env.PORT ?? 3000);

const db = openDatabase(DB_PATH);
const app = createApp(db);

app.listen(PORT, () => {
    console.log(`GinPerium läuft auf Port ${PORT} (Datenbank: ${DB_PATH})`);
});
