// Repository — kapselt allen SQL-Zugriff hinter einer schlanken Schnittstelle.
// Router/Middleware hängen nur von dieser Schnittstelle ab (injiziert), daher gegen
// eine :memory:-SQLite-DB testbar. Erwartet ein node:sqlite-Handle.

export function createRepository(db) {
  const q = (sql) => db.prepare(sql);

  return {
    // --- Users ---
    createUser(u) {
      q('INSERT INTO users(id, username, password_hash, is_admin, created_at) VALUES(?,?,?,?,?)').run(
        u.id,
        u.username,
        u.password_hash,
        u.is_admin ? 1 : 0,
        u.created_at,
      );
      return this.getUserById(u.id);
    },
    getUserById(id) {
      return q('SELECT * FROM users WHERE id = ?').get(id) ?? null;
    },
    getUserByUsername(username) {
      return q('SELECT * FROM users WHERE username = ?').get(username) ?? null;
    },
    setUserPassword(id, passwordHash) {
      q('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
    },
    setUserAdmin(id, isAdmin) {
      q('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, id);
    },
    countUsers() {
      return q('SELECT COUNT(*) as count FROM users').get().count;
    },
    listUsers() {
      return q('SELECT * FROM users ORDER BY username').all();
    },
    deleteUser(id) {
      q('DELETE FROM users WHERE id = ?').run(id);
    },

    // --- Gins ---
    createGin(g) {
      q(
        `INSERT INTO gins(id, name, image, region, taste, alcohol, abv, price_eur, volume_l, category, botanicals, story, perfect_serve, in_stock, is_visible, created_at, updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        g.id,
        g.name,
        g.image,
        g.region,
        g.taste,
        g.alcohol,
        g.abv,
        g.priceEur,
        g.volumeL,
        g.category,
        g.botanicals,
        g.story,
        g.perfectServe,
        g.inStock === false ? 0 : 1,
        g.isVisible === false ? 0 : 1,
        g.createdAt,
        g.updatedAt,
      );
      return this.getGinById(g.id);
    },
    updateGin(id, g) {
      q(
        `UPDATE gins SET
           name = ?, image = ?, region = ?, taste = ?, alcohol = ?, abv = ?,
           price_eur = ?, volume_l = ?, category = ?, botanicals = ?,
           story = ?, perfect_serve = ?, in_stock = ?, is_visible = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        g.name,
        g.image,
        g.region,
        g.taste,
        g.alcohol,
        g.abv,
        g.priceEur,
        g.volumeL,
        g.category,
        g.botanicals,
        g.story,
        g.perfectServe,
        g.inStock === false ? 0 : 1,
        g.isVisible === false ? 0 : 1,
        g.updatedAt,
        id,
      );
      return this.getGinById(id);
    },
    deleteGin(id) {
      q('DELETE FROM gins WHERE id = ?').run(id);
    },
    // Alle Gins (Admin-Verwaltung: auch nicht vorrätige/unsichtbare).
    listGins() {
      return q('SELECT * FROM gins ORDER BY name').all();
    },
    // Nur öffentlich sichtbare Gins (Katalog für Gäste/Nutzer:innen).
    listVisibleGins() {
      return q('SELECT * FROM gins WHERE is_visible = 1 ORDER BY name').all();
    },
    getGinById(id) {
      return q('SELECT * FROM gins WHERE id = ?').get(id) ?? null;
    },
    getGinByName(name) {
      return q('SELECT * FROM gins WHERE name = ?').get(name) ?? null;
    },

    // --- Ratings ---
    upsertRating(r) {
      q(
        `INSERT INTO ratings(id, gin_id, user_id, rating, created_at, updated_at)
         VALUES(?,?,?,?,?,?)
         ON CONFLICT(gin_id, user_id) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at`,
      ).run(r.id, r.ginId, r.userId, r.rating, r.createdAt, r.updatedAt);
    },
    ratingSummaries() {
      const rows = q(
        'SELECT gin_id, AVG(rating) as average_rating, COUNT(*) as rating_count FROM ratings GROUP BY gin_id',
      ).all();
      const summaries = {};
      for (const row of rows) {
        summaries[row.gin_id] = { averageRating: row.average_rating, ratingCount: row.rating_count };
      }
      return summaries;
    },
    userRatingsForUser(userId) {
      const rows = q('SELECT gin_id, rating FROM ratings WHERE user_id = ?').all(userId);
      const ratings = {};
      for (const row of rows) ratings[row.gin_id] = row.rating;
      return ratings;
    },
  };
}
