'use strict';

const crypto = require('node:crypto');

const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS);
    return `scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
    if (typeof storedHash !== 'string') {
        return false;
    }

    const parts = storedHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
        return false;
    }

    const [, saltHex, hashHex] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length, SCRYPT_PARAMS);

    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
