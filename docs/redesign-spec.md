# GinPerium — Redesign-Spezifikation (v2, final)

Konzept für den Umbau zu einer **lean, modern, modular, wartbaren** Web-App.
Angelehnt an die bewährten Muster des Schwesterprojekts **WineCashing**
(gleicher Pi, gleiche Infrastruktur) — WineCashing dient dabei ausschließlich
als **Lesereferenz** und wird nie verändert.

Alle offenen Punkte sind abgestimmt (siehe §13). Dies ist die verbindliche
Grundlage für die Umsetzung.

---

## 1. Ziele & Leitplanken

- **Öffentlich einsehbar.** Der gesamte Gin-Katalog ist ohne Login sichtbar
  (inkl. Durchschnittsbewertungen). Ein Konto braucht man **nur zum Abgeben
  einer eigenen Bewertung**.
- **Modern & ansprechend.** Visuelle Grundrichtung **„botanisch & warm"**
  (Naturtöne, organische Anmutung passend zu den Botanicals), hell/dunkel
  automatisch nach Systemeinstellung.
- **Lean & wartbar.** Vanilla JS ohne Build-Schritt, kleine klar getrennte
  Module, alle sichtbaren Texte/Farben zentral an einer Stelle.
- **Konsistent mit WineCashing.** Login- und Datenbank-Logik werden von dort
  als Muster übernommen (gleiche Architektur, gleiches Deployment-Muster) —
  ohne das WineCashing-Repo selbst anzufassen.
- **Einfach zu nutzen.** Katalog sofort da, Filtern/Sortieren direkt sichtbar,
  Bewerten mit einem Klick.

### Abgestimmte Rahmenentscheidungen

| Thema          | Entscheidung                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sichtbarkeit   | Katalog **öffentlich**, Login nur zum Bewerten                                                                                                   |
| Konten         | **Offene Selbstregistrierung**                                                                                                                   |
| Technik        | Login-/DB-Logik von **WineCashing** übernehmen, Vanilla JS                                                                                       |
| Look           | **Botanisch & warm**, auto hell/dunkel                                                                                                           |
| Zusatzfunktion | **Sortierung** (keine Freitextsuche, keine Detailseiten, kein manueller Theme-Umschalter)                                                        |
| Datenbank      | **Eigene, vollständig getrennte DB** (eigenes Volume/eigene Datei, nichts mit anderen Projekten geteilt); GinPerium-DB darf zurückgesetzt werden |
| Preis-/Alkohol | **Numerische Felder** ergänzen (für Sortierung)                                                                                                  |
| Login-UI       | **Modal-Overlay** auf der Katalogseite                                                                                                           |
| Logo           | **PNG** (`images/GinIcon.png`), kein Emoji                                                                                                       |

---

## 2. Überblick: was bleibt, was sich ändert

**Bleibt inhaltlich:**

- Node.js + Express + `node:sqlite`, ein Docker-Container mit **eigenem**
  Volume auf dem Pi
- Der Gin-Katalog als versionierter Seed (`db/seedData.js`, 19 Gins)
- Bewertungslogik: 1 Bewertung pro Nutzer:in und Gin (Upsert)

**Ändert sich (Architektur, an WineCashing angeglichen):**

- **ESM statt CommonJS** (`"type": "module"`, `import`/`export`)
- **`app.js` wird eine Factory** `createApp({ repo, ...deps })` mit injizierten
  Abhängigkeiten → gegen `:memory:`-SQLite testbar; `server.js` verdrahtet nur.
- **Router als Factories** `createXRouter({ repo, auth, ... })`
- **Session über `express-session`** (httpOnly-Cookie) statt eigener
  `sessions`-Tabelle + selbstgebautem Cookie-Handling
- **Einheitlicher Fehler-Umschlag** `{ error: { code, message } }` über
  `ApiError`/`apiError(key)`/zentralen `errorHandler`
- **Konfiguration über `.env`** (`.env.example` als Vorlage)
- **ESLint (flat) + Prettier + .editorconfig** wie im Schwesterprojekt

**Ändert sich (UX/Frontend, das eigentliche Redesign):**

- Öffentlicher Single-Page-Katalog mit gemeinsamer Navigation
- Login/Registrierung als **Modal-Overlay** statt eigener Seiten
- Neues botanisches Design-System, aufgeräumte Gin-Karten
- Filter **plus Sortierung**, sofort im Katalogkopf bedienbar
- PNG-Logo als Marke

---

## 3. Informationsarchitektur & Seiten

Drei schlanke HTML-Einstiegspunkte (kein Client-Router, wie bei WineCashing):

1. **`index.html` — Öffentlicher Katalog** (Startseite)
   - Kopf: Marke (PNG-Logo), Filter (Region / Geschmack / Botanicals) +
     **Sortierung**
   - Liste der Gin-Karten (öffentlich, inkl. Ø-Bewertung)
   - Navigation mit **Login** (bzw. Nutzername + Logout, wenn eingeloggt)
   - Sternebewertung: Klick ohne Login → Login-Modal; mit Login → speichert
   - Login/Registrierung als **Modal-Overlay** auf derselben Seite

2. **`admin.html` — Verwaltung** (nur `is_admin`)
   - Gin-CRUD (anlegen/bearbeiten/löschen), Nutzerliste
   - Zugriff clientseitig geprüft + serverseitig erzwungen

3. **`datenschutz.html` — Info & Datenschutz**
   - Verweis auf <https://ahultsch.com/privacy.html> (bereits umgesetzt),
     nur im neuen Design gestylt

---

## 4. Nutzerrollen & Zugriffsmodell

| Rolle                      | Sehen                          | Bewerten              | Verwalten        |
| -------------------------- | ------------------------------ | --------------------- | ---------------- |
| **Gast** (kein Login)      | ✅ Katalog + Ø-Bewertungen     | ❌                    | ❌               |
| **Nutzer:in** (eingeloggt) | ✅ + eigene Bewertung markiert | ✅ (1×/Gin, änderbar) | ❌               |
| **Admin** (`is_admin`)     | ✅                             | ✅                    | ✅ Gins + Nutzer |

- **Session**: httpOnly-Cookie via `express-session` (wie WineCashing).
- **Registrierung offen**: `POST /api/auth/register` legt Konto an + Session.
- Erster Account bleibt automatisch Admin (oder per `npm run seed:admin`).

---

## 5. Backend-Umbau (WineCashing-Muster übernehmen)

### 5.1 Struktur

```
server.js              DB öffnen, Repo + App verdrahten, lauschen
app.js                 createApp({ repo, ...deps }) — Factory, injizierbar
routes/
  auth.js               createAuthRouter({ repo, auth, hashPassword, ... })
  gins.js               createGinsRouter({ repo, auth })   ← teils öffentlich
  admin.js              createAdminRouter({ repo, auth })
middleware/
  auth.js               createAuth(repo): requireAuth / requireAdmin / attachUser
  errorEnvelope.js      ApiError, apiError(key), ERR-Tabelle, errorHandler
  rateLimit.js          createRateLimiter({ windowMs, max })
lib/
  password.js           scrypt$N$r$p$salt$hash  (identisches Format wie WineCashing)
  domain.js             publicGin()/Validierung (reine Funktionen)
  ids.js / time.js      UUID / ISO-Zeit
db/
  schema.sql            users, gins, ratings  (sessions-Tabelle entfällt)
  index.js              openDatabase() inkl. Schema-Migration
  repository.js         createRepository(db) — aller SQL-Zugriff gekapselt
  seedData.js           Gin-Katalog + seedGinsIfEmpty()
scripts/
  seedAdmin.js          ADMIN_USER/PASSWORD aus .env
  seedGins.js           Katalog nachträglich einspielen
```

### 5.2 Öffentliche vs. geschützte Endpunkte (neue API-Matrix)

| Methode & Pfad                     | Zugriff        | Zweck                                                             |
| ---------------------------------- | -------------- | ----------------------------------------------------------------- |
| `GET /api/gins`                    | **öffentlich** | Katalog inkl. Ø-Bewertung/Anzahl; `ownRating` nur wenn eingeloggt |
| `POST /api/auth/register`          | öffentlich     | Konto anlegen + Session                                           |
| `POST /api/auth/login`             | öffentlich     | Login                                                             |
| `POST /api/auth/logout`            | eingeloggt     | Logout                                                            |
| `GET /api/auth/me`                 | eingeloggt     | Session-Status fürs Nav                                           |
| `PUT /api/gins/:id/rating`         | **eingeloggt** | eigene Bewertung setzen/ändern                                    |
| `POST/PUT/DELETE /api/admin/gins…` | Admin          | Gin-CRUD                                                          |
| `GET/DELETE /api/admin/users…`     | Admin          | Nutzerverwaltung                                                  |

Kernänderung ggü. heute: **`GET /api/gins` verliert die Login-Pflicht**;
nur das Abgeben einer Bewertung bleibt geschützt.

### 5.3 Datenmodell-Anpassung für Sortierung _(entschieden)_

Sortierung nach Bewertung und Name geht direkt. Für **Preis** und
**Alkohol** sind die heutigen Felder Freitext (`"26,90€ || 0,7l"`,
`"ALC.: 42 %"`) und nicht numerisch sortierbar. Daher:

- Neue **numerische Felder** in `gins`: `price_eur REAL`, `abv REAL`
  (optional `volume_l REAL`) — zusätzlich zu den bestehenden Anzeige-Strings.
- Seed-Daten (`seedData.js`) um diese Werte ergänzen (aus den vorhandenen
  Strings abgeleitet).
- Anzeige bleibt wie gehabt (Strings); sortiert wird über die numerischen
  Felder. Sortier-Optionen: **Name**, **Ø-Bewertung**, **Preis**, **Alkohol**.

### 5.4 Passwort-Format

GinPerium übernimmt das WineCashing-Format `scrypt$N$r$p$saltHex$hashHex`.
Da die GinPerium-DB ohnehin zurückgesetzt wird (§10), entsteht dabei kein
Migrationsproblem mit Altkonten.

---

## 6. Frontend-Architektur (modular, kein Build)

Kleine ES-Module in `public/js/`, jedes mit einer klaren Aufgabe:

```
public/
  index.html            Katalog-Gerüst + <script type="module">
  admin.html            Verwaltungs-Gerüst
  datenschutz.html      Info/Datenschutz
  css/styles.css        Design-System (:root-Tokens) + Komponenten
  js/
    config.js            SITE_NAME, Texte, LOGO_SRC (PNG), Sortier-Optionen — HIER anpassen
    api.js               fetch-Wrapper (credentials, Fehler-Umschlag → Error{code})
    nav.js               gemeinsame Navigation (Login/Logout/Admin/Info)
    catalog.js           laden, State halten, rendern (Katalogseite)
    filters.js           reine Filter-/Sortier-Funktionen (testbar!)
    ratings.js           Sterne-Interaktion + Bewertung senden
    authModal.js         Login/Registrierungs-Overlay
    admin.js             Verwaltungsseite
```

Prinzipien (von WineCashing übernommen):

- **`config.js`** ist die einzige Stelle für sichtbare Texte/Marke. Das Logo
  ist ein **PNG** (`LOGO_SRC = 'images/GinIcon.png'`); die Marke wird als
  `<img class="brand-icon" src=… alt=SITE_NAME>` gerendert (kein Emoji).
- **`nav.js`** rendert eine gemeinsame Navigation; Seiten verdrahten ihre
  eigenen Aktionen über `data-nav`-Attribute. Nutzereingaben werden vor
  `innerHTML` escaped (Self-XSS-Schutz).
- **`api.js`** kapselt alle Endpunkte, wirft `Error` mit `{ status, code,
message }` aus dem Fehler-Umschlag, Timeout-behandelt.
- **`filters.js`** enthält die Filter-/Sortierlogik als **reine Funktionen**
  → per `node --test` ohne Browser testbar.

---

## 7. Design-System „botanisch & warm"

Ein Token-Satz in `:root` (wie WineCashing), Optik-Änderungen nur hier.
Farbwerte sind Richtwerte, im Feinschliff kalibrierbar.

```
Hell:
  --bg:        warmes Creme   (#f5f2e9)
  --surface:   #ffffff
  --surface-2: #ece6d8
  --text:      #2a271f
  --muted:     #7c7566
  --border:    #e3dccc
  --accent:    Salbei-/Botanik-Grün (#4b7d5b)   ← Primärfarbe, Buttons/Sterne-aktiv
  --accent-2:  Terrakotta (#c96f4c)             ← sparsame Sekundärakzente
  --danger:    #a4322b
  --radius:    14px
  --shadow:    0 2px 10px rgba(0,0,0,.08)

Dunkel (prefers-color-scheme: dark):
  --bg #16130d, --surface #201c14, --text #efe9dc, --accent #5c9a71, …
```

Typografie & Anmutung:

- Serifenlose System-Schrift für Fließtext; optional dezente Serifen-Headline
  für Gin-Namen (botanisch-elegant).
- Großzügiger Weißraum, weiche Ecken, sanfte Schatten, organische Trenner.
- Botanicals als **Chips/Tags** statt Fließtext-Liste.

Komponenten:

- **Topbar** mit Marke (**PNG-Logo** + `SITE_NAME`) + Hamburger-Nav.
- **Filter-/Sortierleiste**: Region/Geschmack/Botanicals als Selects,
  Sortierung als eigenes Select, „Zurücksetzen"-Link. Sticky beim Scrollen.
- **Gin-Karte**: Foto, Name, Region/Geschmack/Preis/Alk. als kompakte
  Meta-Zeile, Botanicals als Chips, Story ein-/ausklappbar (Lesbarkeit),
  Perfect-Serve mit Icon, Sternereihe mit Ø + Anzahl.
- **Sterne**: als Gast klickbar → Login-Modal; eingeloggt → sofortiges
  Setzen/Ändern der eigenen Bewertung, optimistisch, mit Fehlerrückmeldung.
- **Auth-Modal**: schlankes Overlay, Tab „Anmelden / Registrieren".
- Zustände: Leerzustand, Ladeindikator, Fehlerbanner (einheitlich).
- Responsiv: 1 Spalte mobil, mehrspaltiges Karten-Grid ab Tablet.
- A11y: Fokusreihenfolge, `aria`-Labels an Sternen/Nav, Kontraste geprüft.

---

## 8. Kern-Flows

1. **Katalog ansehen (Gast):** Seite lädt → `GET /api/gins` (öffentlich) →
   Karten + Ø-Bewertungen. Filtern/Sortieren rein clientseitig.
2. **Filtern & Sortieren:** Auswahl in der Leiste → sofortiges Neurendern
   ohne Reload; Sortierung nach Name / Ø-Bewertung / Preis / Alkohol.
3. **Bewerten:** Klick auf Stern → falls nicht eingeloggt, Auth-Modal;
   nach Login `PUT /api/gins/:id/rating` → Ø + eigene Bewertung aktualisieren.
4. **Login/Registrierung:** Modal-Overlay, offen registrierbar; Session-Cookie;
   Nav zeigt danach Nutzername + Logout.
5. **Admin:** `admin.html` (nur `is_admin`) → Gins pflegen, Nutzer verwalten.

---

## 9. Deployment & Konfiguration (an WineCashing angeglichen)

- **Eigene, getrennte Datenbank.** GinPerium hat ein **eigenes benanntes
  Docker-Volume** und eine **eigene DB-Datei** (`DB_PATH=/data/ginperium.db`),
  völlig unabhängig von WineCashing oder anderen Apps auf dem Pi. Keine
  gemeinsame Datei, kein gemeinsames Volume.
- **`.env`** (Vorlage `.env.example`): `PORT`, `DB_PATH`, `SESSION_SECRET`
  (Pflicht!), `ADMIN_USER`/`ADMIN_PASSWORD`, optional `SECURE_COOKIES`,
  `TRUST_PROXY`.
- **`app.js`** setzt `trust proxy`, konfiguriert `express-session`
  (httpOnly, sameSite=lax, `secure` nur wenn `SECURE_COOKIES=true` —
  passt zum Reverse-Proxy-Betrieb auf dem Pi), und starke Cache-Header
  (`no-store` für App-Assets, `immutable` für versionierte Vendors).
- **Dockerfile / docker-entrypoint.sh**: unverändertes Muster
  (node:24-alpine, `su-exec`, Volume-`chown`) — bereits nahezu identisch.
- **`docker-compose.yml`**: `env_file: .env`, **eigenes** benanntes Volume
  für die DB.
- **Qualität**: `npm run lint` (ESLint flat) + `npm run format` (Prettier),
  `.editorconfig`.

---

## 10. Datenübernahme & Migration

- **Gin-Katalog** bleibt: `seedData.js` + `seedGinsIfEmpty()` beim Start;
  ergänzt um `price_eur`/`abv` (§5.3).
- **GinPerium-DB wird zurückgesetzt.** Das GinPerium-Volume wird einmalig
  neu angelegt (sauberer Schnitt für neues Passwort-Format + neue Spalten);
  der Katalog seedet beim Start automatisch, der Admin wird per
  `npm run seed:admin` (oder erste Registrierung) neu angelegt. Andere
  Projekte/Volumes auf dem Pi sind davon **nicht** betroffen (getrennte DB).

---

## 11. Teststrategie (`node --test`, wie WineCashing)

- `password.test.js` — Hashing/Verify im neuen Format.
- `domain.test.js` — Validierung (Bewertung 1–5, Gin-Felder).
- `filters.test.js` — **neu**: reine Filter-/Sortierfunktionen.
- `seedData.test.js` — Namen eindeutig, Bilder vorhanden, Felder gültig
  (inkl. numerischer Preis-/Alkoholwerte).
- `api.test.js` — Ende-zu-Ende gegen `:memory:`-DB: **öffentlicher**
  Katalogzugriff ohne Login, Bewerten nur mit Login, Admin-Gating,
  Registrierung/Login/Logout.

---

## 12. Umsetzung in Etappen

1. **Backend-Angleichung**: ESM, `createApp`-Factory, `express-session`,
   Fehler-Umschlag, `.env`, `GET /api/gins` öffentlich. Tests grün.
2. **Datenmodell**: numerische `price_eur`/`abv`, Seed ergänzen.
3. **Design-System**: `styles.css` mit botanischen Tokens, `config.js`
   inkl. PNG-Logo.
4. **Frontend-Neubau**: `nav.js`, `catalog.js`, `filters.js`, `ratings.js`,
   `authModal.js`; öffentliche Katalogseite + Sortierung.
5. **Admin-Seite** im neuen Design.
6. **Qualität/Deployment**: ESLint/Prettier, `.env.example`, Docker + eigenes
   Volume prüfen, README aktualisieren.

---

## 13. Abgestimmte Entscheidungen (final)

1. **Getrennte Datenbank** — GinPerium bekommt ein eigenes, von allen anderen
   Projekten vollständig getrenntes Volume/DB-File. Die GinPerium-DB wird für
   den Umbau zurückgesetzt.
2. **Numerische Preis-/Alkohol-Felder** — werden ergänzt (Sortierung).
3. **Login als Modal** — Overlay auf der Katalogseite statt eigener Seiten.
4. **Logo als PNG** — `images/GinIcon.png`, kein Emoji.

Damit ist die Spezifikation final und bereit für die Umsetzung (Etappe 1).

---

## 14. Verbindlicher Infrastruktur-Standard (Pi-weit, alle Projekte)

GinPerium läuft als eigener Docker-Container auf einem Raspberry Pi hinter
einem Caddy-Reverse-Proxy. Eine zentrale Installations-Automatisierung
verwaltet dort mehrere Seiten einheitlich. Damit das funktioniert, **MUSS**
dieses Repo dauerhaft folgendem Vertrag entsprechen — jede künftige Änderung
an diesem Repo muss ihn einhalten, nicht nur der aktuelle Stand:

1. **`Dockerfile` im Repo-Root.** Die App läuft als Container (gilt auch für
   reine Frontends ohne Backend).
2. **Lauscht auf `process.env.PORT`** (Default `3000`, siehe `server.js`).
3. **Start ohne Argumente:** `node server.js` — keine CLI-Flags/Parameter
   nötig, um den Dienst hochzufahren.
4. **Datenbank (falls vorhanden):** SQLite-Datei unter `process.env.DB_PATH`
   (Default `./data/<name>.db`, hier `./data/ginperium.db`); der Host
   mountet `/data` als Docker-Volume (hier: eigenes benanntes Volume, siehe
   §9).
5. **Secrets ausschließlich aus Umgebungsvariablen** — niemals hartkodiert,
   niemals committet: `SESSION_SECRET`; da GinPerium eine Admin-Funktion hat,
   zusätzlich `ADMIN_USER` + `ADMIN_PASSWORD`.
6. **Admin-Seed:** `npm run seed:admin` liest `ADMIN_USER`/`ADMIN_PASSWORD`
   aus der Umgebung (siehe `scripts/seedAdmin.js`). Der Admin-Account wird
   zentral einmal gesetzt und ist über alle Seiten auf dem Pi identisch.
7. **`.env.example`** enthält alle Variablen als Platzhalter; die echte
   `.env` ist über `.gitignore` ausgeschlossen — **das Repo ist öffentlich!**

Dieser Standard ist zusätzlich in `CLAUDE.md` im Repo-Root verankert, damit
er bei jeder künftigen Änderung automatisch berücksichtigt wird. Weicht der
Code einmal davon ab, hat die Angleichung an diesen Vertrag Vorrang vor
anderen Refactorings.
