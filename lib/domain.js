'use strict';

// Reine Validierungsfunktionen ohne DB-/Netzwerkzugriff.

const GIN_FIELDS = ['name', 'image', 'region', 'taste', 'alcohol', 'cost', 'category', 'botanicals', 'story', 'perfectServe'];

function isValidRating(value) {
    return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Validiert ein Gin-Payload-Objekt (aus einer Anfrage).
 * Gibt entweder { valid: true, gin } oder { valid: false, field } zurück.
 */
function validateGinPayload(body) {
    const gin = {};
    for (const field of GIN_FIELDS) {
        const value = String(body?.[field] ?? '').trim();
        if (value === '') {
            return { valid: false, field };
        }
        gin[field] = value;
    }
    return { valid: true, gin };
}

module.exports = { GIN_FIELDS, isValidRating, validateGinPayload };
