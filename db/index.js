'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

/**
 * Öffnet (und migriert bei Bedarf) die SQLite-Datenbank unter dbPath.
 * dbPath === ':memory:' wird für Tests unterstützt.
 */
function openDatabase(dbPath) {
    if (dbPath !== ':memory:') {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }

    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON;');
    if (dbPath !== ':memory:') {
        db.exec('PRAGMA journal_mode = WAL;');
    }

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    return db;
}

module.exports = { openDatabase };
