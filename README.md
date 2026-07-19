# GinPerium

Eine kleine private Web-App zum Entdecken, Filtern und Bewerten von Gins.
Nutzer:innen melden sich an, sehen eine Übersicht aller Gins mit Region,
Geschmack, Botanicals und Perfect Serve, filtern die Liste und geben eine
Sternebewertung ab.

## Tech-Stack

- PHP (mysqli, prepared statements)
- MySQL/MariaDB
- Vanilla JavaScript, kein Framework
- Reines CSS

## Projektstruktur

```
index.php              Einstiegspunkt, leitet je nach Login-Status weiter
php/
  session.php           Sichere Session-Konfiguration (HttpOnly, SameSite)
  db.php                Zentrale Datenbankverbindung
  csrf.php              CSRF-Token für Formulare
  login.php             Anmeldung
  register.php          Registrierung
  logout.php            Abmeldung
  ginperium.php          Gin-Übersicht, Filter, Bewertungen
  datenschutz.php        Datenschutzerklärung
  config.example.php     Vorlage für die Datenbank-Zugangsdaten
css/                    Stylesheets je Seite
js/                     Filter-, Bewertungs- und Cookie-Banner-Logik
Pictures/               Bilder (Flaschen, Hintergründe, Icons)
```

## Setup

1. `php/config.example.php` nach `php/config.php` kopieren und die echten
   Datenbank-Zugangsdaten eintragen. `config.php` wird über `.gitignore`
   ignoriert und darf niemals eingecheckt werden.
2. Datenbank mit mindestens folgenden Tabellen anlegen:
   - `users (id, username, password)` – `password` enthält einen
     `password_hash()`-Wert; `username` sollte eine `UNIQUE`-Spalte sein.
   - `gins (name, image, region, taste, alcohol, cost, category,
     botanicals, story, perfect_serve, …)`
   - `ratings (gin_name, user_id, rating)`
3. Mit PHP ≥ 8.1 und der `mysqli`-Extension auf einem Webserver
   ausliefern (Dokumentenwurzel = Projektwurzel).

## Was bei der Überarbeitung geändert wurde

- **Sicherheit**: Datenbank-Zugangsdaten waren im Klartext in drei
  PHP-Dateien eincheckt. Sie wurden in eine nicht versionierte
  `php/config.php` ausgelagert (`.gitignore` + `config.example.php`).
  **Wichtig:** Da die Zugangsdaten bereits in der bisherigen Git-Historie
  dieses Repos stehen, sollte das Datenbank-Passwort bei Strato
  vorsorglich geändert werden.
- Alle Datenbankabfragen nutzen weiterhin Prepared Statements; Ausgaben
  von Datenbankwerten in HTML werden jetzt konsequent mit
  `htmlspecialchars()` escaped (XSS-Schutz).
- CSRF-Schutz für Login-, Registrierungs- und Bewertungsformular ergänzt.
- Sessions werden mit `HttpOnly`, `SameSite=Lax` und (bei HTTPS) `Secure`
  konfiguriert; nach dem Login wird die Session-ID neu generiert.
- Login prüfte bislang nicht, ob der Benutzername überhaupt existiert;
  Registrierung ließ doppelte Benutzernamen zu und akzeptierte beliebig
  kurze Passwörter. Beides wird jetzt serverseitig validiert.
- **Der Filter-Button war nicht mit JavaScript verknüpft** und hat daher
  gar nichts getan – behoben.
- Bild-/Hintergrundpfade zeigten auf einen nicht existierenden Ordner
  `Bilder`; korrigiert auf den tatsächlichen Ordner `Pictures`.
- Für jeden Gin wurden pro Seitenaufruf zwei zusätzliche Datenbankabfragen
  für die Bewertung ausgeführt (N+1-Problem), obwohl die Bewertungen
  bereits einmalig geladen wurden. Die Seite nutzt jetzt ausschließlich
  die einmalig geladenen Daten.
- Die Botanicals-Filterliste wurde durch zwei unterschiedliche,
  widersprüchliche Code-Pfade befüllt (Split an Komma vs. an Leerzeichen).
  Der doppelte, fehlerhafte Pfad wurde entfernt.
- Der Cookie-Banner wurde nie eingeblendet (CSS stand permanent auf
  „display: none“, nichts hat das je geändert) und die Wahl der
  Nutzer:innen wurde nirgends gespeichert. Der Banner erscheint jetzt
  beim ersten Besuch und merkt sich Zustimmung/Ablehnung im Browser.
- Doppelte Datenbank-Verbindungs- und HTML-Boilerplate aus
  `login.php`, `register.php` und `ginperium.php` in gemeinsame
  Hilfsdateien (`db.php`, `session.php`, `csrf.php`) verschoben.
- `datenschutz.php` bestand aus rund 200 einzelnen `echo`-Anweisungen;
  in normales HTML umgewandelt (gleicher Inhalt, u. a. zwei Stellen mit
  fehlendem Leerzeichen durch aneinandergereihte `echo`s korrigiert).
- Ungültige HTML-Verschachtelung (`<body>` mitten in `<main>`,
  Inhalte vor dem öffnenden `<body>`-Tag) bereinigt.

## Bekannte offene Punkte

- Die Platzhaltertexte in der Datenschutzerklärung (Firmenname, Adresse,
  E-Mail) stammen aus einer Mustervorlage und sollten vor dem Live-Gang
  geprüft und vervollständigt werden.
- Für `users.username` wird ein `UNIQUE`-Index in der Datenbank
  empfohlen, damit gleichzeitige Registrierungen nicht zu doppelten
  Benutzernamen führen können.
