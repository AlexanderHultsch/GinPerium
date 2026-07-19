'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidRating, validateGinPayload } = require('../lib/domain');

test('isValidRating akzeptiert 1 bis 5', () => {
    for (const value of [1, 2, 3, 4, 5]) {
        assert.equal(isValidRating(value), true);
    }
});

test('isValidRating lehnt 0, 6, Kommazahlen und NaN ab', () => {
    for (const value of [0, 6, 3.5, NaN, -1]) {
        assert.equal(isValidRating(value), false);
    }
});

test('validateGinPayload akzeptiert ein vollständiges Payload', () => {
    const result = validateGinPayload({
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

    assert.equal(result.valid, true);
    assert.equal(result.gin.name, 'Bombay Sapphire');
});

test('validateGinPayload lehnt fehlende Felder ab', () => {
    const result = validateGinPayload({ name: 'Bombay Sapphire' });
    assert.equal(result.valid, false);
    assert.equal(result.field, 'image');
});

test('validateGinPayload trimmt Whitespace und lehnt reine Leerzeichen ab', () => {
    const result = validateGinPayload({
        name: '   ',
        image: 'x', region: 'x', taste: 'x', alcohol: 'x', cost: 'x',
        category: 'x', botanicals: 'x', story: 'x', perfectServe: 'x',
    });
    assert.equal(result.valid, false);
    assert.equal(result.field, 'name');
});
