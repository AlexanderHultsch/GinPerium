// DB-Verbindung & Schema-Migration. Node-eingebautes node:sqlite (kein natives Modul).
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Eigene, von anderen Projekten vollständig getrennte Datenbankdatei.
export const DB_PATH = process.env.DB_PATH || join(__dirname, '..', 'data', 'ginperium.db');
const SCHEMA_SQL = () => readFileSync(join(__dirname, 'schema.sql'), 'utf8');

// Öffnet die DB, aktiviert Fremdschlüssel und spielt das Schema ein (idempotent).
// path === ':memory:' für Tests.
export function openDatabase(path = DB_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA_SQL());
  return db;
}
