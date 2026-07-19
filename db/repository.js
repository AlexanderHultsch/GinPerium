'use strict';

/**
 * SQL-Zugriffsschicht hinter einer injizierbaren Schnittstelle.
 * Nimmt eine bereits geöffnete node:sqlite-DatabaseSync-Instanz entgegen.
 */
function createRepository(db) {
    const stmts = {
        insertUser: db.prepare(
            'INSERT INTO users (id, username, password_hash, is_admin, created_at) VALUES (?, ?, ?, ?, ?)'
        ),
        findUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
        findUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
        listUsers: db.prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY username'),
        deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
        setUserAdmin: db.prepare('UPDATE users SET is_admin = ? WHERE id = ?'),
        countUsers: db.prepare('SELECT COUNT(*) as count FROM users'),

        insertSession: db.prepare(
            'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
        ),
        findSession: db.prepare('SELECT * FROM sessions WHERE id = ?'),
        deleteSession: db.prepare('DELETE FROM sessions WHERE id = ?'),
        deleteExpiredSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),

        insertGin: db.prepare(`
            INSERT INTO gins (id, name, image, region, taste, alcohol, cost, category, botanicals, story, perfect_serve, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `),
        updateGin: db.prepare(`
            UPDATE gins SET
                name = ?, image = ?, region = ?, taste = ?, alcohol = ?, cost = ?,
                category = ?, botanicals = ?, story = ?, perfect_serve = ?, updated_at = ?
            WHERE id = ?
        `),
        deleteGin: db.prepare('DELETE FROM gins WHERE id = ?'),
        listGins: db.prepare('SELECT * FROM gins ORDER BY name'),
        findGinById: db.prepare('SELECT * FROM gins WHERE id = ?'),
        findGinByName: db.prepare('SELECT * FROM gins WHERE name = ?'),

        upsertRating: db.prepare(`
            INSERT INTO ratings (id, gin_id, user_id, rating, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(gin_id, user_id) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at
        `),
        ratingSummaries: db.prepare(`
            SELECT gin_id, AVG(rating) as average_rating, COUNT(*) as rating_count
            FROM ratings GROUP BY gin_id
        `),
        userRatingsForUser: db.prepare('SELECT gin_id, rating FROM ratings WHERE user_id = ?'),
    };

    return {
        // Users
        createUser(user) {
            stmts.insertUser.run(user.id, user.username, user.passwordHash, user.isAdmin ? 1 : 0, user.createdAt);
        },
        findUserByUsername(username) {
            return stmts.findUserByUsername.get(username) ?? null;
        },
        findUserById(id) {
            return stmts.findUserById.get(id) ?? null;
        },
        listUsers() {
            return stmts.listUsers.all();
        },
        deleteUser(id) {
            stmts.deleteUser.run(id);
        },
        setUserAdmin(id, isAdmin) {
            stmts.setUserAdmin.run(isAdmin ? 1 : 0, id);
        },
        countUsers() {
            return stmts.countUsers.get().count;
        },

        // Sessions
        createSession(session) {
            stmts.insertSession.run(session.id, session.userId, session.createdAt, session.expiresAt);
        },
        findSession(id) {
            return stmts.findSession.get(id) ?? null;
        },
        deleteSession(id) {
            stmts.deleteSession.run(id);
        },
        deleteExpiredSessions(nowIso) {
            stmts.deleteExpiredSessions.run(nowIso);
        },

        // Gins
        createGin(gin) {
            stmts.insertGin.run(
                gin.id, gin.name, gin.image, gin.region, gin.taste, gin.alcohol,
                gin.cost, gin.category, gin.botanicals, gin.story, gin.perfectServe,
                gin.createdAt, gin.updatedAt
            );
        },
        updateGin(id, gin) {
            stmts.updateGin.run(
                gin.name, gin.image, gin.region, gin.taste, gin.alcohol, gin.cost,
                gin.category, gin.botanicals, gin.story, gin.perfectServe, gin.updatedAt, id
            );
        },
        deleteGin(id) {
            stmts.deleteGin.run(id);
        },
        listGins() {
            return stmts.listGins.all();
        },
        findGinById(id) {
            return stmts.findGinById.get(id) ?? null;
        },
        findGinByName(name) {
            return stmts.findGinByName.get(name) ?? null;
        },

        // Ratings
        upsertRating(rating) {
            stmts.upsertRating.run(
                rating.id, rating.ginId, rating.userId, rating.rating, rating.createdAt, rating.updatedAt
            );
        },
        ratingSummaries() {
            const rows = stmts.ratingSummaries.all();
            const summaries = {};
            for (const row of rows) {
                summaries[row.gin_id] = {
                    averageRating: row.average_rating,
                    ratingCount: row.rating_count,
                };
            }
            return summaries;
        },
        userRatingsForUser(userId) {
            const rows = stmts.userRatingsForUser.all(userId);
            const ratings = {};
            for (const row of rows) {
                ratings[row.gin_id] = row.rating;
            }
            return ratings;
        },
    };
}

module.exports = { createRepository };
