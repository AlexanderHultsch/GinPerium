'use strict';

const { HttpError } = require('./errorEnvelope');

/**
 * Einfacher In-Memory Rate-Limiter (Fixed-Window) pro IP.
 * Für eine Single-Instance-Deployment auf einem Raspberry Pi ausreichend.
 */
function createRateLimit({ windowMs, max }) {
    const hits = new Map();

    return function rateLimitMiddleware(req, res, next) {
        const key = req.ip;
        const now = Date.now();
        const entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        entry.count += 1;
        if (entry.count > max) {
            return next(new HttpError(429, 'RATE_LIMITED', 'Zu viele Versuche. Bitte kurz warten.'));
        }

        next();
    };
}

module.exports = { createRateLimit };
