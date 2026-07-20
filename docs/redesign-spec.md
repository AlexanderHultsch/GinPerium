# GinPerium — Redesign-Spezifikation (v2)

Konzept für den Umbau zu einer **lean, modern, modular, wartbaren** Web-App.
Angelehnt an die bewährten Muster des Schwesterprojekts **WineCashing**
(gleicher Pi, gleiche Infrastruktur). Kein Code — dies ist die Grundlage
für die Umsetzung im nächsten Schritt.

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
  übernommen (gleiche Architektur, gleiches Deployment-Muster).
- **Einfach zu nutzen.** Katalog sofort da, Filtern/Sortieren direkt sichtbar,
  Bewerten mit einem Klick.

### Aus den geklärten Fragen
| Thema | Entscheidung |
|---|---|
| Sichtbarkeit | Katalog **öffentlich**, Login nur zum Bewerten |
| Konten | **Offene Selbstregistrierung** |
| Technik | Login-/DB-Logik von **WineCashing** übernehmen, Vanilla JS |
| Look | **Botanisch & warm**, auto hell/dunkel |
| Zusatzfunktion | **Sortierung** (keine Freitextsuche, keine Detailseiten, kein manueller Theme-Umschalter) |

---

## 2. Überblick: was bleibt, was sich ändert

**Bleibt inhaltlich:**
- Node.js + Express + `node:sqlite`, ein Docker-Container mit Volume auf dem Pi
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
- Login/Registrierung als **Overlay/Modal** statt eigener Seiten
- Neues botanisches Design-System, aufgeräumte Gin-Karten
- Filter **plus Sortierung**, sofort im Katalogkopf bedienbar

---

## 3. Informationsarchitektur & Seiten

Drei schlanke HTML-Einstiegspunkte (kein Client-Router, wie bei WineCashing):

1. **`index.html` — Öffentlicher Katalog** (Startseite)
   - Kopf: Marke, Filter (Region / Geschmack / Botanicals) + **Sortierung**
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

| Rolle | Sehen | Bewerten | Verwalten |
|---|---|---|---|
| **Gast** (kein Login) | ✅ Katalog + Ø-Bewertungen | ❌ | ❌ |
| **Nutzer:in** (eingeloggt) | ✅ + eigene Bewertung markiert | ✅ (1×/Gin, änderbar) | ❌ |
| **Admin** (`is_admin`) | ✅ | ✅ | ✅ Gins + Nutzer |

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
  seedAdmin.js          ADMIN_USERNAME/PASSWORD aus .env
  seedGins.js           Katalog nachträglich einspielen
```

### 5.2 Öffentliche vs. geschützte Endpunkte (neue API-Matrix)
| Methode & Pfad | Zugriff | Zweck |
|---|---|---|
| `GET /api/gins` | **öffentlich** | Katalog inkl. Ø-Bewertung/Anzahl; `ownRating` nur wenn eingeloggt |
| `POST /api/auth/register` | öffentlich | Konto anlegen + Session |
| `POST /api/auth/login` | öffentlich | Login |
| `POST /api/auth/logout` | eingeloggt | Logout |
| `GET /api/auth/me` | eingeloggt | Session-Status fürs Nav |
| `PUT /api/gins/:id/rating` | **eingeloggt** | eigene Bewertung setzen/ändern |
| `POST/PUT/DELETE /api/admin/gins…` | Admin | Gin-CRUD |
| `GET/DELETE /api/admin/users…` | Admin | Nutzerverwaltung |

Kernänderung ggü. heute: **`GET /api/gins` verliert die Login-Pflicht**;
nur das Abgeben einer Bewertung bleibt geschützt.

### 5.3 Datenmodell-Anpassung für Sortierung
Sortierung nach Bewertung und Name geht direkt. Für **Preis** und
**Alkohol** sind die heutigen Felder Freitext (`"26,90€ || 0,7l"`,
`"ALC.: 42 %"`) und nicht numerisch sortierbar. Vorschlag:

- Neue **numerische Felder** in `gins`: `price_eur REAL`, `abv REAL`
  (optional `volume_l REAL`) — zusätzlich zu den bestehenden Anzeige-Strings.
- Seed-Daten (`seedData.js`) um diese Werte ergänzen (aus den vorhandenen
  Strings ableitbar).
- Anzeige bleibt wie gehabt; sortiert wird über die numerischen Felder.

*(Alternative ohne Schemaänderung: Zahlen clientseitig aus den Strings
parsen. Weniger robust — Empfehlung ist das saubere numerische Feld.)*

### 5.4 Passwort-Format
WineCashing nutzt `scrypt$N$r$p$saltHex$hashHex`. GinPerium nutzt aktuell
`scrypt:salt:hash`. Für volle Konsistenz wird das WineCashing-Format
übernommen. **Konsequenz:** bereits auf dem Pi registrierte Konten (bisher
altes Format) müssten sich neu registrieren bzw. Passwort zurücksetzen.
Da die Seite frisch live ist, ist das unkritisch (siehe §10).

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
    config.js            SITE_NAME, Texte, Emojis/Logo, Sortier-Optionen — HIER anpassen
    api.js               fetch-Wrapper (credentials, Fehler-Umschlag → Error{code})
    nav.js               gemeinsame Navigation (Login/Logout/Admin/Info)
    catalog.js           laden, State halten, rendern (Katalogseite)
    filters.js           reine Filter-/Sortier-Funktionen (testbar!)
    ratings.js           Sterne-Interaktion + Bewertung senden
    authModal.js         Login/Registrierungs-Overlay
    admin.js             Verwaltungsseite
```

Prinzipien (von WineCashing übernommen):
- **`config.js`** ist die einzige Stelle für sichtbare Texte/Marke/Emojis.
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
- **Topbar** mit Marke (Blatt-/Botanik-Emoji als Logo, in `config.js`) +
  Hamburger-Nav.
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
4. **Login/Registrierung:** Overlay, offen registrierbar; Session-Cookie;
   Nav zeigt danach Nutzername + Logout.
5. **Admin:** `admin.html` (nur `is_admin`) → Gins pflegen, Nutzer verwalten.

---

## 9. Deployment & Konfiguration (an WineCashing angeglichen)

- **`.env`** (Vorlage `.env.example`): `PORT`, `DB_PATH`, `SESSION_SECRET`
  (Pflicht!), `ADMIN_USERNAME`/`ADMIN_PASSWORD`, optional `SECURE_COOKIES`,
  `TRUST_PROXY`.
- **`app.js`** setzt `trust proxy`, konfiguriert `express-session`
  (httpOnly, sameSite=lax, `secure` nur wenn `SECURE_COOKIES=true` —
  passt zum Reverse-Proxy-Betrieb auf dem Pi), und starke Cache-Header
  (`no-store` für App-Assets, `immutable` für versionierte Vendors).
- **Dockerfile / docker-entrypoint.sh**: unverändertes Muster
  (node:24-alpine, `su-exec`, Volume-`chown`) — bereits nahezu identisch.
- **`docker-compose.yml`**: `env_file: .env`, benanntes Volume für die DB.
- **Qualität**: `npm run lint` (ESLint flat) + `npm run format` (Prettier),
  `.editorconfig`.

---

## 10. Datenübernahme & Migration

- **Gin-Katalog** bleibt: `seedData.js` + `seedGinsIfEmpty()` beim Start;
  ergänzt um `price_eur`/`abv` (§5.3).
- **Bestehende DB auf dem Pi** enthält aktuell nur den geseedeten Katalog
  (regenerierbar) und ggf. einen frisch registrierten Admin-Account.
  Empfehlung: **DB-Volume einmalig zurücksetzen** und neu seeden — sauberer
  Schnitt für das neue Passwort-Format und die neuen Spalten. Danach Admin
  per `npm run seed:admin` (oder erste Registrierung) neu anlegen.
- Falls das Volume erhalten bleiben soll: leichte Migration (neue Spalten
  additiv), Nutzerkonten müssten sich einmalig neu registrieren.

---

## 11. Teststrategie (`node --test`, wie WineCashing)

- `password.test.js` — Hashing/Verify im neuen Format.
- `domain.test.js` — Validierung (Bewertung 1–5, Gin-Felder).
- `filters.test.js` — **neu**: reine Filter-/Sortierfunktionen.
- `seedData.test.js` — Namen eindeutig, Bilder vorhanden, Felder gültig.
- `api.test.js` — Ende-zu-Ende gegen `:memory:`-DB: **öffentlicher**
  Katalogzugriff ohne Login, Bewerten nur mit Login, Admin-Gating,
  Registrierung/Login/Logout.

---

## 12. Umsetzung in Etappen (Vorschlag)

1. **Backend-Angleichung**: ESM, `createApp`-Factory, `express-session`,
   Fehler-Umschlag, `.env`, `GET /api/gins` öffentlich. Tests grün.
2. **Datenmodell**: numerische `price_eur`/`abv`, Seed ergänzen.
3. **Design-System**: `styles.css` mit botanischen Tokens, `config.js`.
4. **Frontend-Neubau**: `nav.js`, `catalog.js`, `filters.js`, `ratings.js`,
   `authModal.js`; öffentliche Katalogseite + Sortierung.
5. **Admin-Seite** im neuen Design.
6. **Qualität/Deployment**: ESLint/Prettier, `.env.example`, Docker prüfen,
   README aktualisieren.

---

## 13. Offene Punkte (bitte bestätigen, dann ist die Spec final)

1. **DB-Reset ok?** Für das neue Passwort-Format + neue Spalten empfehle ich,
   das DB-Volume auf dem Pi einmalig zurückzusetzen (Katalog wird automatisch
   neu geseedet, Admin neu anlegen). Einverstanden — oder Volume erhalten?
2. **Numerische Preis-/Alkohol-Felder** hinzufügen (für saubere Sortierung)?
   Empfehlung: ja.
3. **Login als Modal** auf der Katalogseite (statt eigener Login-/Register-
   Seiten)? Empfehlung: ja (leaner, moderner).
4. **Marke/Logo**: Emoji als Logo (z. B. 🌿) in `config.js`, oder soll ein
   vorhandenes Bild (`images/GinIcon.png`) als Logo dienen?
```
