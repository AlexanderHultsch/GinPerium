// Admin-Bootstrap: legt den ersten is_admin-Nutzer an bzw. befördert einen
// bestehenden. Liest ADMIN_USERNAME / ADMIN_PASSWORD aus der Umgebung
// (siehe .env.example). Idempotent: existiert der Nutzer bereits, wird sein
// Passwort aktualisiert und is_admin gesetzt.
// Aufruf:  npm run seed:admin
import { openDatabase } from '../db/index.js';
import { createRepository } from '../db/repository.js';
import { hashPassword } from '../lib/password.js';
import { newId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error('Fehlt: ADMIN_USERNAME und ADMIN_PASSWORD müssen gesetzt sein (siehe .env.example).');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Das Passwort muss mindestens 8 Zeichen lang sein.');
  process.exit(1);
}

try {
  const repo = createRepository(openDatabase());
  const existing = repo.getUserByUsername(username);
  if (existing) {
    repo.setUserPassword(existing.id, hashPassword(password));
    if (!existing.is_admin) repo.setUserAdmin(existing.id, true);
    console.log(`Admin "${username}" aktualisiert.`);
  } else {
    repo.createUser({
      id: newId(),
      username,
      password_hash: hashPassword(password),
      is_admin: true,
      created_at: nowIso(),
    });
    console.log(`Admin "${username}" angelegt.`);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
