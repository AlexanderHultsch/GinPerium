'use strict';

const express = require('express');
const { newId } = require('../lib/ids');
const { nowIso } = require('../lib/time');
const { requireAdmin } = require('../middleware/auth');
const { HttpError } = require('../middleware/errorEnvelope');
const { toGinDto } = require('./gins');
const { validateGinPayload } = require('../lib/domain');

function readGinPayload(body) {
    const result = validateGinPayload(body);
    if (!result.valid) {
        throw new HttpError(400, 'INVALID_INPUT', `Feld "${result.field}" darf nicht leer sein.`);
    }
    return result.gin;
}

function createAdminRouter(repo) {
    const router = express.Router();

    router.use(requireAdmin);

    // -- Gins --

    router.post('/gins', (req, res) => {
        const payload = readGinPayload(req.body);

        if (repo.findGinByName(payload.name)) {
            throw new HttpError(409, 'GIN_EXISTS', 'Ein Gin mit diesem Namen existiert bereits.');
        }

        const timestamp = nowIso();
        const id = newId();
        repo.createGin({ id, ...payload, createdAt: timestamp, updatedAt: timestamp });

        res.status(201).json(toGinDto(repo.findGinById(id), null, null));
    });

    router.put('/gins/:id', (req, res) => {
        const existing = repo.findGinById(req.params.id);
        if (!existing) {
            throw new HttpError(404, 'GIN_NOT_FOUND', 'Dieser Gin existiert nicht.');
        }

        const payload = readGinPayload(req.body);

        const duplicate = repo.findGinByName(payload.name);
        if (duplicate && duplicate.id !== existing.id) {
            throw new HttpError(409, 'GIN_EXISTS', 'Ein Gin mit diesem Namen existiert bereits.');
        }

        repo.updateGin(existing.id, { ...payload, updatedAt: nowIso() });

        const summaries = repo.ratingSummaries();
        res.json(toGinDto(repo.findGinById(existing.id), summaries[existing.id], null));
    });

    router.delete('/gins/:id', (req, res) => {
        const existing = repo.findGinById(req.params.id);
        if (!existing) {
            throw new HttpError(404, 'GIN_NOT_FOUND', 'Dieser Gin existiert nicht.');
        }

        repo.deleteGin(existing.id);
        res.json({ ok: true });
    });

    // -- Users --

    router.get('/users', (req, res) => {
        res.json(repo.listUsers().map((user) => ({
            id: user.id,
            username: user.username,
            isAdmin: Boolean(user.is_admin),
            createdAt: user.created_at,
        })));
    });

    router.delete('/users/:id', (req, res) => {
        if (req.params.id === req.user.id) {
            throw new HttpError(400, 'CANNOT_DELETE_SELF', 'Du kannst dich nicht selbst löschen.');
        }

        const existing = repo.findUserById(req.params.id);
        if (!existing) {
            throw new HttpError(404, 'USER_NOT_FOUND', 'Dieser Nutzer existiert nicht.');
        }

        repo.deleteUser(existing.id);
        res.json({ ok: true });
    });

    return router;
}

module.exports = { createAdminRouter };
