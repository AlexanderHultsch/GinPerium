# GinPerium

Eine kleine private Web-App zum Entdecken, Filtern, Sortieren und Bewerten
von Gins. Der **Katalog ist öffentlich einsehbar** — inklusive
Durchschnittsbewertungen. Ein Konto braucht man **nur, um selbst eine
Bewertung abzugeben**. Die erste registrierte Person wird automatisch zur
Admin und kann über eine eigene Oberfläche (`/admin.html`) Gins anlegen,
bearbeiten und löschen sowie Nutzer:innen verwalten.

Architektur, Login- und Datenbank-Muster orientieren sich bewusst am
Schwesterprojekt **WineCashing** (gleicher Pi, gleiche Infrastruktur):
ESM, Express, `express-session`, `node:sqlite`, eine injizierbare
Repository-Schicht, ein einheitlicher Fehler-Umschlag. Details und
Hintergrund der Entscheidungen stehen in
[`docs/redesign-spec.md`](docs/redesign-spec.md).

## Tech-Stack

- Node.js (>= 20) mit Express + `express-session`
- SQLite über das eingebaute `node:sqlite`-Modul (kein npm-DB-Treiber nötig)
- Vanilla JavaScript (ES-Module) im Frontend, kein Build-Schritt
- Docker / Docker Compose für das Deployment, **eigenes** Volume
- ESLint (flat config) + Prettier

## Projektstruktur

```
server.js              Einstiegspunkt: DB öffnen, Repo + App verdrahten, lauschen
app.js                  Express-App-Factory: createApp({ repo, ... }), injizierbar
Dockerfile              Container-Build (node:24-alpine, npm ci --omit=dev)
docker-entrypoint.sh    chown /data an node, dann Rechte über su-exec abgeben
docker-compose.yml      Ein Service, eigenes benanntes Volume für die DB-Datei
routes/
  auth.js               createAuthRouter: Register/Login/Logout/me
  gins.js                createGinsRouter: Katalog (öffentlich) + Bewertung (Login)
  admin.js                createAdminRouter: Gin-CRUD + Nutzerverwaltung (nur Admin)
middleware/
  auth.js                 createAuth(repo): attachUser / requireAuth / requireAdmin
  errorEnvelope.js         ApiError, apiError(key), ERR-Tabelle, zentraler errorHandler
  rateLimit.js             In-Memory Rate-Limiter für Login/Registrierung
lib/
  domain.js                Reine Validierung + Antwort-Shaping (kein DB-/Netzwerkzugriff)
  password.js               scrypt-Hashing (node:crypto)
  ids.js / time.js           UUIDs / ISO-Zeit
db/
  schema.sql                Datenmodell (users, gins, ratings)
  index.js                   DB öffnen + Schema-Migration (node:sqlite)
  repository.js              SQL-Zugriff hinter injizierbarer Schnittstelle
  seedData.js                 Ursprünglicher Gin-Katalog (19 Gins) + Auto-Seed
scripts/
  seedAdmin.js                Admin anlegen/befördern (npm run seed:admin)
  seedGins.js                  Katalog aus seedData.js nachträglich einspielen
public/
  index.html                  Öffentlicher Katalog: Filter, Sortierung, Bewertung
  admin.html                  Verwaltung (Gins + Nutzer:innen, nur Admin)
  datenschutz.html            Verweis auf die allgemeine Datenschutzerklärung
  css/styles.css              Design-System "botanisch & warm" (:root-Tokens, hell/dunkel)
  js/
    config.js                 Sichtbare Texte, Logo, Sortier-Optionen — hier anpassen
    api.js                    fetch-Wrapper inkl. Session-Cookie + Fehler-Umschlag
    nav.js                     Gemeinsame Navigation (Login/Logout/Admin/Info)
    catalog.js                 Katalogseite: laden, filtern, sortieren, bewerten
    filters.js                  Reine Filter-/Sortierfunktionen (browserlos testbar)
    ratings.js                  Sterne-Markup + Klick-Verdrahtung
    authModal.js                 Login/Registrierung als Modal-Overlay
    admin.js                    Verwaltungsseite
    cookieBanner.js              Cookie-Hinweis inkl. Persistenz
  images/
    gins/                      Flaschenfotos
    ui/                        Icons (Perfect-Serve-Symbol)
    GinIcon.png                Logo (Marke)
test/
  password.test.js            Passwort-Hashing
  domain.test.js               Reine Validierungslogik
  filters.test.js               Reine Filter-/Sortierfunktionen
  seedData.test.js               Katalog-Daten (Namen eindeutig, Bilder vorhanden, gültig)
  api.test.js                    Ende-zu-Ende über echten HTTP-Server (:memory:)
  helpers/testServer.js           Test-Harness (Server + Cookie-Handling)
```

## Zugriffsmodell

| Rolle                  | Sehen                          | Bewerten              | Verwalten        |
| ---------------------- | ------------------------------ | --------------------- | ---------------- |
| Gast (kein Login)      | ✅ Katalog + Ø-Bewertungen     | ❌                    | ❌               |
| Nutzer:in (eingeloggt) | ✅ + eigene Bewertung markiert | ✅ (1×/Gin, änderbar) | ❌               |
| Admin (`is_admin`)     | ✅                             | ✅                    | ✅ Gins + Nutzer |

`GET /api/gins` ist der einzige öffentliche API-Endpunkt mit echten Daten;
alles andere verlangt mindestens eine Session (Bewerten) bzw. Admin-Rechte
(Verwaltung).

## Gin-Katalog / Seed-Daten

`db/seedData.js` enthält den ursprünglichen Gin-Katalog (19 Gins,
rekonstruiert aus einem Backup der alten Seite, inkl. numerischer
`priceEur`/`abv`-Felder für die Sortierung) fest im Repo. Beim ersten
Start wird eine **leere** `gins`-Tabelle automatisch damit befüllt
(`seedGinsIfEmpty` in `server.js`) — dadurch bringt jedes frische Docker-
Volume auf dem Pi den kompletten Katalog gleich mit, ohne dass man ihn
manuell über `/admin.html` neu eintippen muss. Spätere Änderungen über
die Admin-Oberfläche werden dabei nie überschrieben, da nur bei komplett
leerer Tabelle geseedet wird.

Zum nachträglichen (erneuten) Einspielen einzelner fehlender Katalog-
Einträge, ohne bereits vorhandene/bearbeitete Gins anzufassen:

```bash
npm run seed:gins
# bzw. im Container:
docker compose exec ginperium node scripts/seedGins.js
```

Es wird bewusst **keine** fertig befüllte `.db`-Datei ins Repo committet —
die Live-Datenbank enthält auch Nutzer:innen, Sessions und Bewertungen und
würde bei jeder Nutzung des Pi Merge-Konflikte mit dem Repo erzeugen.
Stattdessen liegen die Katalog-Daten als lesbarer, diffbarer JS-Datensatz
im Repo und werden beim Start automatisch in die (dann tatsächlich auf dem
Pi liegende, **eigene**) Datenbank geschrieben.

## Setup (lokal, ohne Docker)

```bash
npm install
cp .env.example .env   # SESSION_SECRET etc. eintragen
npm run dev            # node --watch --env-file=.env server.js
```

Die Seite ist danach unter `http://localhost:3000` erreichbar, der
Katalog ist ohne Login sichtbar und automatisch befüllt (siehe oben). Der
erste registrierte Account wird automatisch zum Admin und kann unter
`/admin.html` weitere Gins anlegen. Bilddateien werden dabei aus
`public/images/` referenziert (Pfad relativ dazu angeben, z. B.
`gins/meinneuergin.jpg` — die Datei muss dort tatsächlich liegen, ein
Upload über die Oberfläche gibt es bewusst nicht).

## Setup mit Docker (empfohlen für den Raspberry Pi)

```bash
cp .env.example .env   # SESSION_SECRET etc. eintragen
docker compose up -d --build
```

- Die SQLite-Datei liegt im **eigenen**, benannten Volume `ginperium_data`
  unter `/data/ginperium.db` — vollständig getrennt von anderen Projekten
  auf demselben Pi (kein gemeinsames Volume, keine gemeinsame Datei).
- Die Seite läuft auf Port 3000 (in `docker-compose.yml` anpassbar).
- Admin-Nutzer nachträglich anlegen/befördern:
  ```bash
  docker compose exec ginperium node scripts/seedAdmin.js <benutzername> <passwort>
  ```
  (liest alternativ `ADMIN_USERNAME`/`ADMIN_PASSWORD` aus der Umgebung)

## Tests & Qualität

```bash
npm test      # node --test — inkl. Ende-zu-Ende-Test gegen :memory:-SQLite
npm run lint  # ESLint (flat config)
npm run format # Prettier --write
```

## Umzug von der PHP/MySQL-Version (Ausgangslage)

Diese Version ersetzt die ursprüngliche PHP/MySQL-Umsetzung vollständig:

- **Datenbank**: MySQL (Strato) → eigene SQLite-Datei im eigenen Docker-
  Volume. Bewertungen hängen an einer echten Gin-ID (Fremdschlüssel) statt
  am Gin-Namen als Text, und pro Nutzer:in ist genau eine Bewertung je Gin
  möglich (`UNIQUE(gin_id, user_id)` mit Upsert).
- **Backend**: PHP-Skripte pro Seite → Express-Factories
  (`createApp`/`createXRouter`) mit sauber getrennten Routen-, Middleware-
  und DB-Schichten, injizierbar und ohne echten Server testbar.
- **Frontend**: serverseitig gerenderte Seiten → statisches HTML + ES-
  Module, die die JSON-API per `fetch` ansprechen. Login/Registrierung
  laufen als Modal auf der Katalogseite statt als eigene Seiten.
- **Sichtbarkeit**: Ursprünglich war der komplette Katalog hinter einem
  Login versteckt. Jetzt ist er öffentlich lesbar; ein Konto braucht man
  nur noch zum Bewerten.
- **Gin-Verwaltung**: Es gibt eine echte Oberfläche (`/admin.html`), um
  Gins anzulegen/zu bearbeiten/zu löschen. Vorher ging das nur direkt in
  der Datenbank (z. B. über phpMyAdmin bei Strato) — auf dem Pi ohne
  solches Tool keine Option mehr.
- **Auth**: Passwort-Hashing weiterhin mit einem starken KDF (scrypt über
  `node:crypto`), Sessions jetzt über `express-session` statt eigenem
  Cookie-/Session-Handling.

## Datenschutz

`public/datenschutz.html` verweist auf die allgemeine Datenschutzerklärung
der Landing-Page unter <https://ahultsch.com/privacy.html>; es gibt keine
separate Erklärung mehr für Ginperium selbst.

## Bekannte offene Punkte

- Es gibt keinen Bild-Upload über die Admin-Oberfläche — neue
  Flaschenfotos werden manuell auf den Pi (bzw. in das Docker-Volume/
  Repo unter `public/images/gins/`) kopiert, bevor man den Dateinamen im
  Formular einträgt. Das ist so gewollt, kein offener Punkt.
- `node:sqlite` ist in Node.js noch als experimentell markiert; für ein
  privates Hobbyprojekt unkritisch, aber im Hinterkopf zu behalten.
- Der Docker-Build wurde in der Entwicklungsumgebung nicht gegen eine
  echte Docker-Engine getestet (kein Daemon verfügbar) — bitte einmal
  `docker compose up --build` auf dem Pi verifizieren.
