'use strict';

function nowIso() {
    return new Date().toISOString();
}

function addMillis(isoString, millis) {
    return new Date(new Date(isoString).getTime() + millis).toISOString();
}

module.exports = { nowIso, addMillis };
