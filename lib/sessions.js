'use strict';

const { newId } = require('./ids');
const { nowIso, addMillis } = require('./time');
const { parseCookies, serializeCookie } = require('./cookies');

const SESSION_COOKIE_NAME = 'ginperium_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage

function isHttps(req) {
    return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function createSessionCookie(repo, userId, req, res) {
    const id = newId();
    const createdAt = nowIso();
    const expiresAt = addMillis(createdAt, SESSION_TTL_MS);

    repo.createSession({ id, userId, createdAt, expiresAt });

    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, id, {
        maxAgeMs: SESSION_TTL_MS,
        secure: isHttps(req),
    }));

    return id;
}

function clearSessionCookie(repo, req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[SESSION_COOKIE_NAME];
    if (sessionId) {
        repo.deleteSession(sessionId);
    }

    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE_NAME, '', {
        maxAgeMs: 0,
        secure: isHttps(req),
    }));
}

/**
 * Liest den Session-Cookie aus der Anfrage und liefert den zugehörigen
 * Nutzer zurück, oder null wenn keine gültige Session vorliegt.
 */
function resolveSessionUser(repo, req) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[SESSION_COOKIE_NAME];
    if (!sessionId) {
        return null;
    }

    const session = repo.findSession(sessionId);
    if (!session) {
        return null;
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
        repo.deleteSession(sessionId);
        return null;
    }

    return repo.findUserById(session.user_id);
}

module.exports = { createSessionCookie, clearSessionCookie, resolveSessionUser, SESSION_COOKIE_NAME };
