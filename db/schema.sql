-- GinPerium — Datenmodell. Eigene, von anderen Projekten vollständig
-- getrennte SQLite-Datei/Volume.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin      INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
    created_at    TEXT NOT NULL             -- ISO 8601 UTC
);

CREATE TABLE IF NOT EXISTS gins (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,
    image         TEXT NOT NULL,
    region        TEXT NOT NULL,
    taste         TEXT NOT NULL,
    alcohol       TEXT NOT NULL,             -- Anzeige-String, z.B. "ALC.: 42 %"
    abv           REAL NOT NULL,             -- numerisch, für Sortierung
    cost          TEXT NOT NULL,             -- Anzeige-String, z.B. "26,90€ || 0,7l"
    price_eur     REAL NOT NULL,             -- numerisch, für Sortierung
    volume_l      REAL,                      -- optional, numerisch
    category      TEXT NOT NULL,
    botanicals    TEXT NOT NULL,             -- kommagetrennt
    story         TEXT NOT NULL,
    perfect_serve TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ratings (
    id         TEXT PRIMARY KEY,
    gin_id     TEXT NOT NULL REFERENCES gins(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (gin_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_gin_id ON ratings(gin_id);
