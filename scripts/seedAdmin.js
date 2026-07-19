'use strict';

// Legt einen Admin-Nutzer an oder befördert einen bestehenden Nutzer zum Admin.
//
// Verwendung:
//   node scripts/seedAdmin.js <benutzername> <passwort>
//   ADMIN_USERNAME=... ADMIN_PASSWORD=... node scripts/seedAdmin.js
//
// Hinweis: Der erste jemals registrierte Nutzer wird ohnehin automatisch
// zum Admin. Dieses Skript ist für den Fall gedacht, dass man später einen
// weiteren Nutzer befördern oder einen Admin-Zugang zurücksetzen möchte.

const { openDatabase } = require('../db');
const { createRepository } = require('../db/repository');
const { newId } = require('../lib/ids');
const { nowIso } = require('../lib/time');
const { hashPassword } = require('../lib/password');

const DB_PATH = process.env.DB_PATH ?? '/data/ginperium.sqlite';

function readCredentials() {
    const username = process.argv[2] ?? process.env.ADMIN_USERNAME;
    const password = process.argv[3] ?? process.env.ADMIN_PASSWORD;

    if (!username || !password) {
        console.error('Benutzername und Passwort fehlen.');
        console.error('Nutzung: node scripts/seedAdmin.js <benutzername> <passwort>');
        process.exit(1);
    }
    if (password.length < 8) {
        console.error('Das Passwort muss mindestens 8 Zeichen lang sein.');
        process.exit(1);
    }

    return { username: username.trim(), password };
}

function main() {
    const { username, password } = readCredentials();
    const db = openDatabase(DB_PATH);
    const repo = createRepository(db);

    const existing = repo.findUserByUsername(username);

    if (existing) {
        repo.setUserAdmin(existing.id, true);
        console.log(`Nutzer "${username}" wurde zum Admin befördert.`);
    } else {
        repo.createUser({
            id: newId(),
            username,
            passwordHash: hashPassword(password),
            isAdmin: true,
            createdAt: nowIso(),
        });
        console.log(`Admin-Nutzer "${username}" wurde angelegt.`);
    }

    db.close();
}

main();
