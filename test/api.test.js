import test from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers/testServer.js';

const BASE_GIN = {
  image: 'x',
  region: 'x',
  taste: 'x',
  alcohol: 'x',
  abv: 40,
  priceEur: 1,
  volumeL: 0.5,
  category: 'x',
  botanicals: 'x',
  story: 'x',
  perfectServe: 'x',
};

test('Auth-, Gin- und Admin-Flow Ende-zu-Ende', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await t.test('Katalog ist öffentlich lesbar (kein Login nötig)', async () => {
    const res = await server.request('GET', '/api/gins');
    assert.equal(res.status, 200);
    assert.deepEqual(res.data.gins, []);
  });

  await t.test('Bewerten ohne Login -> 401', async () => {
    const res = await server.request('PUT', '/api/gins/irgendeine-id/rating', { rating: 5 });
    assert.equal(res.status, 401);
    assert.equal(res.data.error.code, 'UNAUTHENTICATED');
  });

  await t.test('Registrierung: erster Nutzer wird automatisch Admin', async () => {
    const res = await server.request('POST', '/api/auth/register', { username: 'owner', password: 'einpasswort123' });
    assert.equal(res.status, 201);
    assert.equal(res.data.user.isAdmin, true);
  });

  await t.test('zu kurzes Passwort wird abgelehnt', async () => {
    const res = await server.request('POST', '/api/auth/register', { username: 'zukurz', password: '123' });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, 'WEAK_PASSWORD');
  });

  await t.test('doppelter Benutzername wird abgelehnt', async () => {
    const res = await server.request('POST', '/api/auth/register', { username: 'owner', password: 'einpasswort123' });
    assert.equal(res.status, 409);
    assert.equal(res.data.error.code, 'USERNAME_TAKEN');
  });

  await t.test('Login mit falschem Passwort schlägt fehl', async () => {
    const res = await server.request('POST', '/api/auth/login', { username: 'owner', password: 'falsch' });
    assert.equal(res.status, 401);
    assert.equal(res.data.error.code, 'INVALID_CREDENTIALS');
  });

  let ownerId;
  await t.test('Login mit korrekten Daten setzt Session-Cookie', async () => {
    const res = await server.request('POST', '/api/auth/login', { username: 'owner', password: 'einpasswort123' });
    assert.equal(res.status, 200);
    assert.equal(res.data.user.isAdmin, true);
    ownerId = res.data.user.id;
  });

  await t.test('/api/auth/me liefert den angemeldeten Nutzer', async () => {
    const res = await server.request('GET', '/api/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.data.user.username, 'owner');
  });

  let ginId;
  await t.test('Admin kann einen Gin anlegen; Preis/Menge werden zu einem Text kombiniert', async () => {
    const res = await server.request('POST', '/api/admin/gins', {
      ...BASE_GIN,
      name: 'Bombay Sapphire',
      priceEur: 26.9,
      volumeL: 0.7,
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.gin.name, 'Bombay Sapphire');
    assert.equal(res.data.gin.cost, '26,90 € für 0,7 l');
    assert.equal(res.data.gin.inStock, true);
    assert.equal(res.data.gin.isVisible, true);
    ginId = res.data.gin.id;
  });

  await t.test('Gin ohne volumeL wird abgelehnt (Menge ist Pflichtfeld)', async () => {
    const { volumeL: _volumeL, ...rest } = BASE_GIN;
    const res = await server.request('POST', '/api/admin/gins', { ...rest, name: 'Ohne Menge' });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, 'VALIDATION');
  });

  await t.test('Gin taucht öffentlich (ohne Login) in der Liste auf', async () => {
    const res = await server.request('GET', '/api/gins');
    assert.equal(res.status, 200);
    assert.equal(res.data.gins.length, 1);
    assert.equal(res.data.gins[0].ratingCount, 0);
  });

  await t.test('Bewertung abgeben aktualisiert Durchschnitt und Anzahl', async () => {
    const res = await server.request('PUT', `/api/gins/${ginId}/rating`, { rating: 4 });
    assert.equal(res.status, 200);
    assert.equal(res.data.gin.averageRating, 4);
    assert.equal(res.data.gin.ratingCount, 1);

    const list = await server.request('GET', '/api/gins');
    assert.equal(list.data.gins[0].ownRating, 4);
  });

  await t.test('erneutes Bewerten überschreibt die eigene Bewertung statt sie zu duplizieren', async () => {
    await server.request('PUT', `/api/gins/${ginId}/rating`, { rating: 2 });
    const list = await server.request('GET', '/api/gins');
    assert.equal(list.data.gins[0].averageRating, 2);
    assert.equal(list.data.gins[0].ratingCount, 1);
  });

  await t.test('ungültige Bewertung wird abgelehnt', async () => {
    const res = await server.request('PUT', `/api/gins/${ginId}/rating`, { rating: 9 });
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, 'INVALID_RATING');
  });

  await t.test('doppelter Gin-Name beim Anlegen wird abgelehnt', async () => {
    const res = await server.request('POST', '/api/admin/gins', { ...BASE_GIN, name: 'Bombay Sapphire' });
    assert.equal(res.status, 409);
    assert.equal(res.data.error.code, 'GIN_EXISTS');
  });

  await t.test(
    'Als ausverkauft markierter Gin bleibt im öffentlichen Katalog sichtbar (nur inStock: false)',
    async () => {
      const update = await server.request('PUT', `/api/admin/gins/${ginId}`, {
        ...BASE_GIN,
        name: 'Bombay Sapphire',
        priceEur: 26.9,
        volumeL: 0.7,
        inStock: false,
      });
      assert.equal(update.status, 200);
      assert.equal(update.data.gin.inStock, false);

      const list = await server.request('GET', '/api/gins');
      assert.equal(list.data.gins.length, 1);
      assert.equal(list.data.gins[0].inStock, false);
    },
  );

  await t.test('Als unsichtbar markierter Gin verschwindet aus dem öffentlichen Katalog', async () => {
    const update = await server.request('PUT', `/api/admin/gins/${ginId}`, {
      ...BASE_GIN,
      name: 'Bombay Sapphire',
      priceEur: 26.9,
      volumeL: 0.7,
      isVisible: false,
    });
    assert.equal(update.status, 200);

    const list = await server.request('GET', '/api/gins');
    assert.equal(list.data.gins.length, 0);
  });

  await t.test('Unsichtbarer Gin bleibt in der Admin-Übersicht sichtbar', async () => {
    const res = await server.request('GET', '/api/admin/gins');
    assert.equal(res.status, 200);
    assert.equal(res.data.gins.length, 1);
    assert.equal(res.data.gins[0].isVisible, false);
  });

  await t.test('Gin wieder sichtbar schalten bringt ihn zurück in den öffentlichen Katalog', async () => {
    await server.request('PUT', `/api/admin/gins/${ginId}`, {
      ...BASE_GIN,
      name: 'Bombay Sapphire',
      priceEur: 26.9,
      volumeL: 0.7,
      isVisible: true,
      inStock: true,
    });
    const list = await server.request('GET', '/api/gins');
    assert.equal(list.data.gins.length, 1);
    assert.equal(list.data.gins[0].inStock, true);
  });

  await t.test('Logout löscht die Session', async () => {
    const res = await server.request('POST', '/api/auth/logout');
    assert.equal(res.status, 204);
    const me = await server.request('GET', '/api/auth/me');
    assert.equal(me.status, 401);
  });

  await t.test('normaler Nutzer (nicht Admin) darf keine Gins anlegen', async () => {
    await server.request('POST', '/api/auth/register', { username: 'gast', password: 'gastpasswort1' });
    await server.request('POST', '/api/auth/login', { username: 'gast', password: 'gastpasswort1' });

    const res = await server.request('POST', '/api/admin/gins', { ...BASE_GIN, name: 'Illegal' });
    assert.equal(res.status, 403);
    assert.equal(res.data.error.code, 'NOT_ADMIN');
  });

  await t.test('normaler Nutzer sieht den Katalog weiterhin (öffentlich)', async () => {
    const res = await server.request('GET', '/api/gins');
    assert.equal(res.status, 200);
    assert.equal(res.data.gins.length, 1);
  });

  await t.test('normaler Nutzer darf keine Nutzerliste sehen', async () => {
    const res = await server.request('GET', '/api/admin/users');
    assert.equal(res.status, 403);
  });

  await t.test('normaler Nutzer darf keine Admin-Gin-Übersicht sehen', async () => {
    const res = await server.request('GET', '/api/admin/gins');
    assert.equal(res.status, 403);
  });

  await t.test('Admin kann sich selbst nicht löschen', async () => {
    await server.request('POST', '/api/auth/login', { username: 'owner', password: 'einpasswort123' });
    const res = await server.request('DELETE', `/api/admin/users/${ownerId}`);
    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, 'CANNOT_DELETE_SELF');
  });

  await t.test('Admin kann einen Gin löschen', async () => {
    const res = await server.request('DELETE', `/api/admin/gins/${ginId}`);
    assert.equal(res.status, 204);
    const list = await server.request('GET', '/api/gins');
    assert.equal(list.data.gins.length, 0);
  });

  assert.ok(ownerId, 'ownerId sollte gesetzt sein');
});
