# GinPerium

Eine kleine private Web-App zum Entdecken, Filtern und Bewerten von Gins.
Nutzer:innen melden sich an, sehen eine Übersicht aller Gins mit Region,
Geschmack, Botanicals und Perfect Serve, filtern die Liste und geben eine
Sternebewertung ab. Die erste registrierte Person wird automatisch zur
Admin und kann über eine eigene Oberfläche Gins anlegen, bearbeiten und
löschen sowie Nutzer:innen verwalten.

Für den Betrieb auf einem Raspberry Pi wurde die Seite vollständig von
PHP/MySQL auf **Node.js + SQLite** umgestellt: kein separater
Datenbankserver, ein einzelner Docker-Container, eine Datei als
Datenbank.

## Tech-Stack

- Node.js (>= 22.5) mit Express
- SQLite über das eingebaute `node:sqlite`-Modul (kein npm-DB-Treiber nötig)
- Vanilla JavaScript im Frontend, kein Build-Schritt
- Docker / Docker Compose für das Deployment

## Projektstruktur

```
server.js              Einstiegspunkt: DB öffnen, App erzeugen, lauschen
app.js                  Express-App-Factory (Static, Router, Fehler-Umschlag)
Dockerfile              Container-Build (node:24-alpine, npm ci --omit=dev)
docker-entrypoint.sh    chown /data an node, dann Rechte über su-exec abgeben
docker-compose.yml      Ein Service, ein benanntes Volume für die DB-Datei
routes/
  auth.js               Register/Login/Logout/me
  gins.js                Gin-Liste (inkl. Bewertungen) + Bewertung abgeben
  admin.js                Gin-CRUD und Nutzerverwaltung (nur für Admins)
middleware/
  auth.js                 attachUser / requireAuth / requireAdmin
  errorEnvelope.js         Einheitlicher JSON-Fehler-Umschlag
  rateLimit.js             In-Memory Rate-Limiter für Login/Registrierung
lib/
  domain.js                Reine Validierungsfunktionen (Bewertung, Gin-Payload)
  password.js               scrypt-Hashing (node:crypto)
  sessions.js                Session-Cookie erzeugen/prüfen/löschen
  cookies.js                 Kleine Cookie-Parse/Serialize-Helfer
  ids.js / time.js           UUIDs / ISO-Zeit
db/
  schema.sql                Datenmodell (users, sessions, gins, ratings)
  index.js                   DB öffnen + Schema-Migration (node:sqlite)
  repository.js              SQL-Zugriff hinter injizierbarer Schnittstelle
scripts/
  seedAdmin.js                Admin anlegen/befördern (npm run seed:admin)
public/
  index.html                  Gin-Katalog mit Filter und Bewertung
  admin.html                  Verwaltung (Gins + Nutzer:innen)
  login.html / register.html
  datenschutz.html            Datenschutzerklärung
  css/styles.css
  js/
    api.js                    fetch-Wrapper inkl. Session-Cookie
    app.js                    Katalogseite: laden, filtern, bewerten
    admin.js                  Verwaltungsseite
    auth.js                   Login-/Registrierungsformulare
    cookieBanner.js            Cookie-Hinweis inkl. Persistenz
  images/
    gins/                      Flaschenfotos
    ui/                        Hintergründe, Icons
test/
  password.test.js            Passwort-Hashing
  domain.test.js               Reine Validierungslogik
  api.test.js                  Ende-zu-Ende über echten HTTP-Server (:memory:)
  helpers/testServer.js         Test-Harness (Server + Cookie-Handling)
```

## Setup (lokal, ohne Docker)

```bash
npm install
DB_PATH=./ginperium.sqlite npm start
```

Die Seite ist danach unter `http://localhost:3000` erreichbar. Der erste
registrierte Account wird automatisch zum Admin und kann unter
`/admin.html` Gins anlegen. Bilddateien werden dabei aus
`public/images/` referenziert (Pfad relativ dazu angeben, z. B.
`gins/meinneuergin.jpg` – die Datei muss dort tatsächlich liegen).

## Setup mit Docker (empfohlen für den Raspberry Pi)

```bash
docker compose up -d --build
```

- Die SQLite-Datei liegt im benannten Volume `ginperium_data` unter
  `/data/ginperium.sqlite` und übersteht damit Container-Updates.
- Die Seite läuft auf Port 3000 (in `docker-compose.yml` anpassbar).
- Admin-Nutzer nachträglich anlegen/befördern:
  ```bash
  docker compose exec ginperium node scripts/seedAdmin.js <benutzername> <passwort>
  ```

## Tests

```bash
npm test
```

Läuft mit dem eingebauten Node-Testrunner (`node --test`), inklusive
eines Ende-zu-Ende-Tests, der einen echten HTTP-Server gegen eine
In-Memory-SQLite-Datenbank startet.

## Umzug von der alten PHP/MySQL-Version

Diese Version ersetzt die vorherige PHP/MySQL-Umsetzung vollständig:

- **Datenbank**: MySQL (Strato) → SQLite-Datei im Docker-Volume. Bewertungen
  hängen jetzt an einer echten Gin-ID (Fremdschlüssel) statt am Gin-Namen
  als Text, und pro Nutzer:in ist genau eine Bewertung je Gin möglich
  (`UNIQUE(gin_id, user_id)` mit Upsert) statt beliebig vieler Duplikate.
- **Backend**: PHP-Skripte pro Seite → Express mit sauber getrennten
  Routen/Middleware/DB-Schichten.
- **Frontend**: serverseitig gerenderte PHP-Seiten → statisches HTML +
  JavaScript, das die JSON-API per `fetch` anspricht (keine Formular-
  Neuladung mehr beim Bewerten).
- **Gin-Verwaltung**: Es gibt jetzt eine echte Oberfläche (`/admin.html`),
  um Gins anzulegen/zu bearbeiten/zu löschen. Vorher ging das nur direkt
  in der Datenbank (z. B. über phpMyAdmin bei Strato) – auf einem
  Raspberry-Pi-Setup ohne solches Tool war das keine Option mehr.
- **Auth**: Passwort-Hashing weiterhin mit einem starken KDF (jetzt
  scrypt über `node:crypto` statt PHPs `password_hash`), Sessions über
  einen eigenen, in der DB gespeicherten Token statt PHP-Sessions.

Die alten PHP-Dateien und Bilder wurden aus dem Projekt entfernt; die
Flaschenfotos liegen jetzt unter `public/images/gins/`.

## Datenschutz

`public/datenschutz.html` verweist auf die allgemeine Datenschutzerklärung
der Landing-Page unter <https://ahultsch.com/privacy.html>; es gibt keine
separate Erklärung mehr für Ginperium selbst.

## Bekannte offene Punkte

- Es gibt keinen Bild-Upload über die Admin-Oberfläche – neue
  Flaschenfotos werden manuell auf den Pi (bzw. in das Docker-Volume/
  Repo unter `public/images/gins/`) kopiert, bevor man den Dateinamen im
  Formular einträgt. Das ist so gewollt und kein offener Punkt mehr.
- `node:sqlite` ist in Node.js noch als experimentell markiert; das ist
  für ein privates Hobbyprojekt unkritisch, sollte aber im Hinterkopf
  bleiben.
- Der Docker-Build wurde in dieser Umgebung nicht gegen eine echte
  Docker-Engine getestet (kein Daemon verfügbar) – bitte einmal
  `docker compose up --build` auf dem Pi verifizieren.
