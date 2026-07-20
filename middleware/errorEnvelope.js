// Einheitlicher Fehler-Umschlag: { "error": { "code": "...", "message": "..." } }

// Wirf diesen Fehler in Handlern; der zentrale Error-Handler formatiert ihn.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Bekannte Fehlercodes.
export const ERR = {
  USERNAME_TAKEN: [409, 'USERNAME_TAKEN'],
  WEAK_PASSWORD: [400, 'WEAK_PASSWORD'],
  INVALID_CREDENTIALS: [401, 'INVALID_CREDENTIALS'],
  UNAUTHENTICATED: [401, 'UNAUTHENTICATED'],
  NOT_ADMIN: [403, 'NOT_ADMIN'],
  USER_NOT_FOUND: [404, 'USER_NOT_FOUND'],
  GIN_NOT_FOUND: [404, 'GIN_NOT_FOUND'],
  GIN_EXISTS: [409, 'GIN_EXISTS'],
  INVALID_RATING: [400, 'INVALID_RATING'],
  VALIDATION: [400, 'VALIDATION'],
  NOT_FOUND: [404, 'NOT_FOUND'],
  RATE_LIMITED: [429, 'RATE_LIMITED'],
  CANNOT_DELETE_SELF: [400, 'CANNOT_DELETE_SELF'],
};

export function apiError(key, message) {
  const [status, code] = ERR[key];
  return new ApiError(status, code, message);
}

// Zentraler Express-Error-Handler.
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: { code, message: err.message || 'Interner Fehler' } });
}
