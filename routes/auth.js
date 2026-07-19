'use strict';

const express = require('express');
const { newId } = require('../lib/ids');
const { nowIso } = require('../lib/time');
const { hashPassword, verifyPassword } = require('../lib/password');
const { createSessionCookie, clearSessionCookie } = require('../lib/sessions');
const { requireAuth } = require('../middleware/auth');
const { HttpError } = require('../middleware/errorEnvelope');
const { createRateLimit } = require('../middleware/rateLimit');

const authRateLimit = createRateLimit({ windowMs: 60_000, max: 10 });

function createAuthRouter(repo) {
    const router = express.Router();

    router.post('/register', authRateLimit, (req, res) => {
        const username = String(req.body.username ?? '').trim();
        const password = String(req.body.password ?? '');

        if (username === '' || password === '') {
            throw new HttpError(400, 'INVALID_INPUT', 'Benutzername und Passwort dürfen nicht leer sein.');
        }
        if (password.length < 8) {
            throw new HttpError(400, 'WEAK_PASSWORD', 'Das Passwort muss mindestens 8 Zeichen lang sein.');
        }
        if (repo.findUserByUsername(username)) {
            throw new HttpError(409, 'USERNAME_TAKEN', 'Dieser Benutzername ist bereits vergeben.');
        }

        const isFirstUser = repo.countUsers() === 0;

        repo.createUser({
            id: newId(),
            username,
            passwordHash: hashPassword(password),
            isAdmin: isFirstUser,
            createdAt: nowIso(),
        });

        res.status(201).json({ ok: true });
    });

    router.post('/login', authRateLimit, (req, res) => {
        const username = String(req.body.username ?? '').trim();
        const password = String(req.body.password ?? '');

        const user = repo.findUserByUsername(username);
        if (!user || !verifyPassword(password, user.password_hash)) {
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Benutzername oder Passwort ungültig.');
        }

        createSessionCookie(repo, user.id, req, res);
        res.json({ id: user.id, username: user.username, isAdmin: Boolean(user.is_admin) });
    });

    router.post('/logout', (req, res) => {
        clearSessionCookie(repo, req, res);
        res.json({ ok: true });
    });

    router.get('/me', requireAuth, (req, res) => {
        res.json({ id: req.user.id, username: req.user.username, isAdmin: Boolean(req.user.is_admin) });
    });

    return router;
}

module.exports = { createAuthRouter };
