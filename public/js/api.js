// Client-API-Wrapper. Sendet das Login-Cookie automatisch (credentials).
// Fehler werfen ein Error mit { status, code, message } aus dem Fehler-Umschlag.

const API_BASE = '/api';
export const REQUEST_TIMEOUT_MS = 15000;

export async function apiFetch(path, { method = 'GET', body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const opts = { method, headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const aborter = new AbortController();
  const timer = setTimeout(() => aborter.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(API_BASE + path, { ...opts, signal: aborter.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('Zeitüberschreitung — bitte erneut versuchen.');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const err = new Error(data?.error?.message || res.statusText || 'Fehler');
    err.status = res.status;
    err.code = data?.error?.code || `HTTP_${res.status}`;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (username, password) => apiFetch('/auth/register', { method: 'POST', body: { username, password } }),
  login: (username, password) => apiFetch('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),

  // Katalog — öffentlich lesbar, Bewerten nur eingeloggt
  listGins: () => apiFetch('/gins'),
  rateGin: (id, rating) => apiFetch(`/gins/${id}/rating`, { method: 'PUT', body: { rating } }),

  // Admin
  adminListGins: () => apiFetch('/admin/gins'),
  adminCreateGin: (gin) => apiFetch('/admin/gins', { method: 'POST', body: gin }),
  adminUpdateGin: (id, gin) => apiFetch(`/admin/gins/${id}`, { method: 'PUT', body: gin }),
  adminDeleteGin: (id) => apiFetch(`/admin/gins/${id}`, { method: 'DELETE' }),
  adminListUsers: () => apiFetch('/admin/users'),
  adminDeleteUser: (id) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
};
