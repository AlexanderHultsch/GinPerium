'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer } = require('./helpers/testServer');

test('Auth-, Gin- und Admin-Flow Ende-zu-Ende', async (t) => {
    const server = await startTestServer();
    t.after(() => server.close());

    await t.test('nicht angemeldet -> 401 auf /api/gins', async () => {
        const res = await server.request('GET', '/api/gins');
        assert.equal(res.status, 401);
    });

    await t.test('Registrierung: erster Nutzer wird automatisch Admin', async () => {
        const res = await server.request('POST', '/api/auth/register', {
            username: 'owner',
            password: 'einpasswort123',
        });
        assert.equal(res.status, 201);
    });

    await t.test('zu kurzes Passwort wird abgelehnt', async () => {
        const res = await server.request('POST', '/api/auth/register', {
            username: 'zukurz',
            password: '123',
        });
        assert.equal(res.status, 400);
        assert.equal(res.data.error.code, 'WEAK_PASSWORD');
    });

    await t.test('doppelter Benutzername wird abgelehnt', async () => {
        const res = await server.request('POST', '/api/auth/register', {
            username: 'owner',
            password: 'einpasswort123',
        });
        assert.equal(res.status, 409);
        assert.equal(res.data.error.code, 'USERNAME_TAKEN');
    });

    await t.test('Login mit falschem Passwort schlägt fehl', async () => {
        const res = await server.request('POST', '/api/auth/login', {
            username: 'owner',
            password: 'falsch',
        });
        assert.equal(res.status, 401);
    });

    let ownerId;
    await t.test('Login mit korrekten Daten setzt Session-Cookie', async () => {
        const res = await server.request('POST', '/api/auth/login', {
            username: 'owner',
            password: 'einpasswort123',
        });
        assert.equal(res.status, 200);
        assert.equal(res.data.isAdmin, true);
        ownerId = res.data.id;
    });

    await t.test('/api/auth/me liefert den angemeldeten Nutzer', async () => {
        const res = await server.request('GET', '/api/auth/me');
        assert.equal(res.status, 200);
        assert.equal(res.data.username, 'owner');
    });

    let ginId;
    await t.test('Admin kann einen Gin anlegen', async () => {
        const res = await server.request('POST', '/api/admin/gins', {
            name: 'Bombay Sapphire',
            image: 'gins/Bombay.jpg',
            region: 'England',
            taste: 'Zitrus',
            alcohol: '40%',
            cost: '€€',
            category: 'London Dry',
            botanicals: 'Wacholder, Zitrone',
            story: 'Klassiker.',
            perfectServe: 'Mit Tonic',
        });
        assert.equal(res.status, 201);
        assert.equal(res.data.name, 'Bombay Sapphire');
        ginId = res.data.id;
    });

    await t.test('Gin taucht in der Liste auf', async () => {
        const res = await server.request('GET', '/api/gins');
        assert.equal(res.status, 200);
        assert.equal(res.data.length, 1);
        assert.equal(res.data[0].ratingCount, 0);
    });

    await t.test('Bewertung abgeben aktualisiert Durchschnitt und Anzahl', async () => {
        const res = await server.request('PUT', `/api/gins/${ginId}/rating`, { rating: 4 });
        assert.equal(res.status, 200);

        const list = await server.request('GET', '/api/gins');
        assert.equal(list.data[0].averageRating, 4);
        assert.equal(list.data[0].ratingCount, 1);
        assert.equal(list.data[0].ownRating, 4);
    });

    await t.test('erneutes Bewerten überschreibt die eigene Bewertung statt sie zu duplizieren', async () => {
        await server.request('PUT', `/api/gins/${ginId}/rating`, { rating: 2 });
        const list = await server.request('GET', '/api/gins');
        assert.equal(list.data[0].averageRating, 2);
        assert.equal(list.data[0].ratingCount, 1);
    });

    await t.test('ungültige Bewertung wird abgelehnt', async () => {
        const res = await server.request('PUT', `/api/gins/${ginId}/rating`, { rating: 9 });
        assert.equal(res.status, 400);
    });

    await t.test('Logout löscht die Session', async () => {
        const res = await server.request('POST', '/api/auth/logout');
        assert.equal(res.status, 200);

        const me = await server.request('GET', '/api/auth/me');
        assert.equal(me.status, 401);
    });

    await t.test('normaler Nutzer (nicht Admin) darf keine Gins anlegen', async () => {
        await server.request('POST', '/api/auth/register', { username: 'gast', password: 'gastpasswort1' });
        await server.request('POST', '/api/auth/login', { username: 'gast', password: 'gastpasswort1' });

        const res = await server.request('POST', '/api/admin/gins', {
            name: 'Illegal', image: 'x', region: 'x', taste: 'x', alcohol: 'x',
            cost: 'x', category: 'x', botanicals: 'x', story: 'x', perfectServe: 'x',
        });
        assert.equal(res.status, 403);
    });

    assert.ok(ownerId, 'ownerId sollte gesetzt sein');
});
