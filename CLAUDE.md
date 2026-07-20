# CLAUDE.md — GinPerium

Hinweise für Claude Code (und jede andere KI-gestützte Änderung) an diesem
Repo. Diese Datei wird automatisch als Kontext geladen — der hier
beschriebene Standard gilt für **jede** künftige Änderung, nicht nur für den
aktuellen Stand.

## Verbindlicher Infrastruktur-Standard (Pi-weit)

GinPerium läuft als eigener Docker-Container auf einem Raspberry Pi hinter
einem Caddy-Reverse-Proxy. Eine zentrale Installations-Automatisierung
verwaltet dort mehrere Seiten einheitlich. Damit das funktioniert, **MUSS**
dieses Repo jederzeit folgendem Vertrag entsprechen (vollständig auch in
`docs/redesign-spec.md` §14 dokumentiert):

1. **`Dockerfile` im Repo-Root.** Die App läuft als Container (gilt auch für
   reine Frontends ohne Backend).
2. **Lauscht auf `process.env.PORT`** (Default `3000`).
3. **Start ohne Argumente:** `node server.js`.
4. **Falls Datenbank:** SQLite-Datei unter `process.env.DB_PATH` (Default
   `./data/<name>.db`, hier `./data/ginperium.db`); der Host mountet `/data`
   als Volume.
5. **Secrets NUR aus Umgebungsvariablen** — niemals hartkodiert, niemals
   committen: `SESSION_SECRET`; wegen der Admin-Funktion zusätzlich
   `ADMIN_USER` + `ADMIN_PASSWORD`.
6. **Admin-Seed:** `npm run seed:admin` liest `ADMIN_USER`/`ADMIN_PASSWORD`
   aus der Umgebung. Der Admin-Account wird zentral einmal gesetzt und ist
   über alle Seiten auf dem Pi identisch.
7. **`.env.example`** mit allen Variablen als Platzhalter; die echte `.env`
   ist in `.gitignore` — **das Repo ist öffentlich!**

### Was das für Änderungen an diesem Repo bedeutet

- Niemals Secrets (Passwörter, Tokens, Session-Secrets) im Code, in Tests,
  in Doku-Beispielen oder in Commits hartkodieren — immer über
  `process.env.*` mit Vorlage in `.env.example`.
- `.env` bleibt gitignored. Neue Variablen immer zuerst in `.env.example`
  ergänzen (als Platzhalter), nie mit echtem Wert.
- `PORT`, `DB_PATH`, `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD` sind
  die festen, projektübergreifenden Variablennamen — nicht umbenennen oder
  durch Synonyme ersetzen (z. B. nicht `ADMIN_USERNAME`).
- `server.js` muss ohne Argumente startbar bleiben und über `PORT` lauschen;
  `Dockerfile`, `docker-compose.yml` und `docker-entrypoint.sh` müssen mit
  diesem Startverhalten kompatibel bleiben.
- Bei Änderungen an DB-Pfad-Handling (`db/index.js`) den Default
  `./data/ginperium.db` und die Übersteuerung via `DB_PATH` erhalten.
- Bei Änderungen am Admin-Seed (`scripts/seedAdmin.js`) `ADMIN_USER`/
  `ADMIN_PASSWORD` als Quelle beibehalten; das Skript muss idempotent
  bleiben (bestehenden Nutzer aktualisieren statt Fehler zu werfen).
- Weicht der Code an irgendeiner Stelle von diesem Vertrag ab, hat die
  Angleichung Vorrang vor anderen Refactorings.

## Weitere Projektkonventionen

- ESM (`"type": "module"`), `node:sqlite` als DB-Treiber (kein npm-DB-Paket).
- Factory-Pattern wie im Schwesterprojekt WineCashing: `createApp(...)`,
  `createXRouter(...)`, `createRepository(db)`, `createAuth(repo)` —
  injizierbar, gegen `:memory:`-SQLite testbar.
- Einheitlicher Fehler-Umschlag `{ error: { code, message } }` über
  `ApiError`/`apiError(key)`/zentralen `errorHandler`.
- Öffentlicher Lesezugriff auf den Katalog (`GET /api/gins`, nur
  `is_visible=1`), Login nur zum Bewerten, Admin-Routen erfordern
  `is_admin`.
- **WineCashing-Repo (`AlexanderHultsch/WineCashing`) dient nur als
  Lesereferenz für Architekturmuster — niemals verändern.**
- Tests mit `node --test` (`npm test`), Linting mit ESLint flat config
  (`npm run lint`), Formatierung mit Prettier.
- Vor jedem Commit: `npm test`, `npm run lint`, `npx prettier --check .`
  grün halten.
