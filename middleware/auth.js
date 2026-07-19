'use strict';

const { resolveSessionUser } = require('../lib/sessions');
const { HttpError } = require('./errorEnvelope');

/**
 * Liest die Session aus dem Cookie und hängt den Nutzer (oder null) als
 * req.user an. Läuft auf jeder Anfrage, wirft selbst keinen Fehler.
 */
function attachUser(repo) {
    return function attachUserMiddleware(req, res, next) {
        req.user = resolveSessionUser(repo, req);
        next();
    };
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return next(new HttpError(401, 'UNAUTHENTICATED', 'Bitte melde dich an.'));
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.user) {
        return next(new HttpError(401, 'UNAUTHENTICATED', 'Bitte melde dich an.'));
    }
    if (!req.user.is_admin) {
        return next(new HttpError(403, 'FORBIDDEN', 'Nur für Administrator:innen.'));
    }
    next();
}

module.exports = { attachUser, requireAuth, requireAdmin };
