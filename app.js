// Express-App-Factory. Abhängigkeiten injizierbar -> gegen :memory:-SQLite testbar.
import express from 'express';
import session from 'express-session';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAuth } from './middleware/auth.js';
import { errorHandler, apiError } from './middleware/errorEnvelope.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { createAuthRouter } from './routes/auth.js';
import { createGinsRouter } from './routes/gins.js';
import { createAdminRouter } from './routes/admin.js';

import { hashPassword as defaultHash, verifyPassword as defaultVerify } from './lib/password.js';
import { newId as defaultNewId } from './lib/ids.js';
import { nowIso as defaultNow } from './lib/time.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(deps) {
  const {
    repo,
    sessionSecret = process.env.SESSION_SECRET || 'ginperium-dev-secret',
    // Cookie-Secure NICHT an NODE_ENV koppeln: hinter einem Reverse Proxy ist der
    // App-Hop meist HTTP, secure:true würde das Login-Cookie verhindern. Nur
    // einschalten (SECURE_COOKIES=true), wenn die App selbst über HTTPS läuft.
    secureCookie = process.env.SECURE_COOKIES === 'true',
    // Anzahl vertrauenswürdiger Proxy-Hops für req.ip (Rate-Limit) / req.protocol.
    trustProxy = process.env.TRUST_PROXY,
    hashPassword = defaultHash,
    verifyPassword = defaultVerify,
    newId = defaultNewId,
    now = defaultNow,
    enableRateLimit = true,
  } = deps;

  if (!repo) throw new Error('createApp: repo fehlt');
  if (sessionSecret === 'ginperium-dev-secret' && process.env.NODE_ENV === 'production') {
    console.warn('WARN: SESSION_SECRET nicht gesetzt — Standardwert in Produktion ist unsicher.');
  }

  const auth = createAuth(repo);
  const app = express();
  app.disable('x-powered-by');
  app.set(
    'trust proxy',
    trustProxy === undefined ? 1 : Number.isNaN(Number(trustProxy)) ? trustProxy : Number(trustProxy),
  );
  app.use(express.json());
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure: secureCookie, maxAge: 1000 * 60 * 60 * 24 * 30 },
    }),
  );

  const rateLimiter = enableRateLimit ? createRateLimiter({ windowMs: 60_000, max: 20 }) : undefined;

  app.use('/api/auth', createAuthRouter({ repo, auth, hashPassword, verifyPassword, newId, now, rateLimiter }));
  app.use('/api/gins', createGinsRouter({ repo, auth, newId, now }));
  app.use('/api/admin', createAdminRouter({ repo, auth, newId, now }));

  // Unbekannte API-Pfade -> einheitlicher 404-Umschlag.
  app.use('/api', (_req, _res, next) => next(apiError('NOT_FOUND', 'Endpunkt nicht gefunden.')));

  // no-store: die App läuft ggf. hinter einem Cache/Reverse Proxy — ohne "no-store"
  // sehen Nutzer nach einem Deploy sonst noch alten JS-/CSS-Code.
  app.use(
    express.static(join(__dirname, 'public'), {
      setHeaders: (res) => res.setHeader('Cache-Control', 'no-store'),
    }),
  );

  app.use(errorHandler);

  return app;
}
