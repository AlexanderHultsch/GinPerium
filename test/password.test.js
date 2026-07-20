import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/password.js';

test('hashPassword erzeugt für gleiches Passwort unterschiedliche Hashes (Salt)', () => {
  const a = hashPassword('geheimnis123');
  const b = hashPassword('geheimnis123');
  assert.notEqual(a, b);
});

test('verifyPassword akzeptiert das korrekte Passwort', () => {
  const hash = hashPassword('geheimnis123');
  assert.equal(verifyPassword('geheimnis123', hash), true);
});

test('verifyPassword lehnt ein falsches Passwort ab', () => {
  const hash = hashPassword('geheimnis123');
  assert.equal(verifyPassword('falsches-passwort', hash), false);
});

test('verifyPassword ist robust gegenüber kaputten/leeren Hashes', () => {
  assert.equal(verifyPassword('irgendwas', ''), false);
  assert.equal(verifyPassword('irgendwas', null), false);
  assert.equal(verifyPassword('irgendwas', 'kein-scrypt-hash'), false);
});
