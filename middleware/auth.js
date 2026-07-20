// Zugriffskontrolle. Als Factory über das Repo, Session via express-session (req.session).
import { apiError } from './errorEnvelope.js';

export function createAuth(repo) {
  function currentUser(req) {
    const userId = req.session?.userId;
    if (!userId) return null;
    return repo.getUserById(userId) ?? null;
  }

  // Setzt req.user (oder null), blockiert nie. Für öffentliche Endpunkte, die den
  // Login-Status optional berücksichtigen (z.B. eigene Bewertung im Katalog anzeigen).
  function attachUser(req, _res, next) {
    req.user = currentUser(req);
    next();
  }

  // Eingeloggter Nutzer (Session). Setzt req.user.
  function requireAuth(req, _res, next) {
    const user = currentUser(req);
    if (!user) return next(apiError('UNAUTHENTICATED', 'Bitte melde dich an.'));
    req.user = user;
    return next();
  }

  // Nur is_admin. Setzt req.user.
  function requireAdmin(req, _res, next) {
    const user = currentUser(req);
    if (!user) return next(apiError('UNAUTHENTICATED', 'Bitte melde dich an.'));
    if (!user.is_admin) return next(apiError('NOT_ADMIN', 'Adminrechte erforderlich.'));
    req.user = user;
    return next();
  }

  return { currentUser, attachUser, requireAuth, requireAdmin };
}
