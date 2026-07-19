<?php

// Fehlermeldungen anzeigen
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Session starten
session_start();
// Wenn keine Benutzer-ID in der Session vorhanden ist, zum Login umleiten
if (!isset($_SESSION['user_id'])) {
  header("Location: ../php/login.php");
  exit;
}

// Datenbankverbindungsinformationen
$servername = "rdbms.strato.de";
$username = "dbu2657325";
$password = "StratoGoq2czhnf*";
$dbname = "dbs10509076";

// Verbindung zur Datenbank herstellen
$conn = new mysqli($servername, $username, $password, $dbname);
// Bei Verbindungsfehlern abbrechen
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Funktion zum Abrufen von Filteroptionen
function getFilterOptions($conn, $column, $table) {
  // SQL-Abfrage erstellen
  $sql = "SELECT $column FROM $table";
  // SQL-Abfrage ausführen
  $result = $conn->query($sql);
  // Array für Filteroptionen erstellen
  $options = [];

  // Zeilen des Ergebnisses durchlaufen
  while ($row = $result->fetch_assoc()) {
      // Verarbeitung der Werte für Regionen und Botanicals
      if ($column == 'region') {
          $value = explode('/', $row[$column])[0];
      } else if ($column == 'botanicals') {
          $botanicals = explode(',', $row[$column]);
          foreach ($botanicals as $botanical) {
              $value = trim($botanical);
              if (!in_array($value, $options)) {
                  $options[] = $value;
              }
          }
          continue;
      } else {
          $value = $row[$column];
      }

      // Wert zum Array hinzufügen, wenn er noch nicht vorhanden ist
      if (!in_array($value, $options)) {
          $options[] = $value;
      }
  }

  // Filteroptionen zurückgeben
  return $options;
}

// Filteroptionen für Regionen, Geschmäcker und Botanicals abrufen
$regions = getFilterOptions($conn, 'region', 'gins');
$tastes = getFilterOptions($conn, 'taste', 'gins');
$botanicals = [];

// Botanicals von allen Gins abrufen
$sql = "SELECT botanicals FROM gins";
$result = $conn->query($sql);

// Botanicals aus allen Gins extrahieren und zu einem Array hinzufügen
while ($row = $result->fetch_assoc()) {
    $currentBotanicals = explode(" ", $row['botanicals']);
    $botanicals = array_merge($botanicals, $currentBotanicals);
}

// Duplikate entfernen und alphabetisch sortieren
$botanicals = array_unique($botanicals);
sort($regions);
sort($tastes);
sort($botanicals);


// Funktion zum Abrufen von Bewertungen aus der Datenbank
function fetchRatingsFromDatabase($conn) {
  $sql = "SELECT gin_name, COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as rating_count FROM ratings GROUP BY gin_name";
  $result = $conn->query($sql);

  $ratings = [];
  while ($row = $result->fetch_assoc()) {
    $ratings[$row['gin_name']] = [
      'average_rating' => $row['average_rating'],
      'rating_count' => $row['rating_count']
    ];
  }
  return $ratings;
}

// Bewertungen aus der Datenbank abrufen
$ratings = fetchRatingsFromDatabase($conn);


// Bewertungen zählen
function getRatingCount($conn, $gin_name) {
  // SQL-Abfrage erstellen
  $sql = "SELECT COUNT(*) as rating_count FROM ratings WHERE gin_name = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("s", $gin_name);
  $stmt->execute();
  // Ergebnis der Abfrage auswerten und Bewertungsanzahl zurückgeben
  $result = $stmt->get_result();
  $row = $result->fetch_assoc();
  return $row['rating_count'];
}


// Bewertung speichern
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['gin_name']) && isset($_POST['rating'])) {
  // Überprüfen, ob die Bewertung eine gültige Zahl zwischen 0 und 5 ist
  if ($_POST['rating'] > 0 && $_POST['rating'] <= 5) {
    $stmt = $conn->prepare("INSERT INTO ratings (gin_name, user_id, rating) VALUES (?, ?, ?)");
    $stmt->bind_param("sii", $_POST['gin_name'], $_SESSION['user_id'], $_POST['rating']);
    $stmt->execute();
    $stmt->close();

    // Um das erneute Absenden des Formulars beim Aktualisieren der Seite zu verhindern, wird eine Weiterleitung auf die gleiche Seite durchgeführt
    header("Location: ginperium.php");
    exit;
  }
}

// Alle Gins abrufen
$stmt = $conn->prepare("SELECT * FROM gins");
$stmt->execute();
$result = $stmt->get_result();

$stmt->close();
?>




<!DOCTYPE html>
<html>
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description"
          content="Entdecke eine große Auswahl an Gin auf Ginperium, meiner eigenen privaten Gin-Seite.">
      <link rel="stylesheet" href="../css/ginperium_styles.css">
      <link rel="shortcut icon" href="#">
      <link rel="icon" type="image/png" href="../Bilder/GinPerium.png">
      <link rel="apple-touch-icon" sizes="180x180" href="../Bilder/GinPerium.png">
      <title>Ginperium</title>
  </head>


  <div id="cookie-banner" class="cookie-banner">
        <div class="cookie-banner-content">
            <p>Hey, ich nutze Cookies! 🍪 <br>
            Um dir auf meiner Website ein optimales Erlebnis zu bieten, setzen ich Cookies ein. 
            Durch das Surfen auf meiner Seite stimmst du der Verwendung von Cookies gemäß unserer Cookie-Richtlinie zu.🌐✅</p>
            <button id="accept-cookies" class="cookie-banner-button">Akzeptieren</button>
            <button id="decline-cookies" class="cookie-banner-button">Ablehnen</button>
        </div>
    </div>


  <main>
    <body>
      <section id="Home"></section>
      <section id="Gin">
        <div class="SearchBar">

          <h1 id="MainHead">Ginperium</h1>

          <label id="RegionSelectLabel" for="RegionSelect">Region: </label>
          <select id="RegionSelect" name="Region">
            <option value="keine Präferenz">keine Präferenz</option>
            <?php foreach ($regions as $region): ?>
              <option value="<?= htmlspecialchars($region) ?>"><?= htmlspecialchars($region) ?></option>
            <?php endforeach; ?>
          </select>

          <br>
          <label id="TasteSelectLabel" for="TasteSelect">Geschmack: </label>
          <select id="TasteSelect" name="Taste">
          <option value="keine Präferenz">keine Präferenz</option>
          <?php foreach ($tastes as $taste): ?>
          <option value="<?= htmlspecialchars($taste) ?>"><?= htmlspecialchars($taste) ?></option>
          <?php endforeach; ?>
          </select>

          <br>

          <label for="BotanicalSelect">Botanicals: </label>
          <select id="BotanicalSelect" name="Botanicals">
          <option value="keine Präferenz">keine Präferenz</option>
          <?php foreach ($botanicals as $botanical): ?>
          <option value="<?= htmlspecialchars($botanical) ?>"><?= htmlspecialchars($botanical) ?></option>
          <?php endforeach; ?>
          </select>

          <div class="button-group">
            <button id="SearchButton" class="filter-button">Filter</button>
            <button id="LogoutButton" class="logout-button" onclick="location.href='../php/logout.php'">Abmelden</button>
          </div>

        </div>



        <?php while ($gin = $result->fetch_assoc()): ?>
        <?php
        // Durchschnittliche Bewertung abrufen
        $stmt = $conn->prepare("SELECT AVG(rating) as average_rating FROM ratings WHERE gin_name = ?");
        $stmt->bind_param("s", $gin['name']);
        $stmt->execute();
        $rating_result = $stmt->get_result();
        $row = $rating_result->fetch_assoc();
        $gin['average_rating'] = $row['average_rating'] ?? 0;
        // Bewertungsanzahl abrufen
        $rating_count = getRatingCount($conn, $gin['name']);
        ?>
        <div class="GinContainer">
          <div class="LeftColumn">
            <img class="BottlePic" src="<?= $gin['image'] ?>" alt="<?= $gin['name'] ?>">
            <p class="Region"><?= $gin['region'] ?></p>
            <p class="Taste"><?= $gin['taste'] ?></p>
            <p class="Alc"><?= $gin['alcohol'] ?></p>
            <p class="Cost"><?= $gin['cost'] ?></p>
          </div>
          <div class="RightColumn">
            <h2 class="GinName"><?= $gin['name'] ?></h2>
            <p class="Category"><?= $gin['category'] ?></p>
            <p class="Botanicals"><?= $gin['botanicals'] ?></p>
            <p class="Story"><?= $gin['story'] ?></p>
            <img class="PS_pic" src="../Bilder/PerfectServe.svg" alt="Perfect Serve.svg">
            <p class="Perfect_Serve"><?= $gin['perfect_serve'] ?></p>

            <div class="average-rating">
              <div class="stars" data-rating="<?= round($gin['average_rating']) ?>">
                <?php for ($i = 1; $i <= 5; $i++): ?>
                  <span class="star" data-value="<?= $i ?>">&#9734;</span>
                <?php endfor; ?>
              </div>
              <p class="rating-count"><?= $rating_count ?> Bewertungen</p>
              <form class="rating-form" method="post">
                <input type="hidden" name="gin_name" value="<?= $gin['name'] ?>">
                <input type="hidden" data-gin-name="<?= $gin['name'] ?>" name="rating" value="1">
                <input type="submit" name="submit_1" value="Bewerten" class="button-rating">
              </form>

            </div>
          </div>
        </div>
        <?php endwhile; ?>

        <footer>
            <p>&copy; Alexander Hultsch</p>
            <a href="../php/datenschutz.php">Datenschutzerklärung</a>
        </footer>
    </body>
    <script src="../js/gin-script.js"></script>
  </main>

</html>"