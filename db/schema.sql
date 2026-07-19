-- GinPerium Datenmodell (SQLite)

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin      INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS gins (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL UNIQUE,
    image         TEXT NOT NULL,
    region        TEXT NOT NULL,
    taste         TEXT NOT NULL,
    alcohol       TEXT NOT NULL,
    cost          TEXT NOT NULL,
    category      TEXT NOT NULL,
    botanicals    TEXT NOT NULL,
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
