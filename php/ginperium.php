<?php
require __DIR__ . '/session.php';
require __DIR__ . '/db.php';
require __DIR__ . '/csrf.php';

start_secure_session();
require_login();

$conn = get_db_connection();

// Filteroptionen für ein Auswahlfeld ermitteln (Regionen, Geschmäcker, Botanicals)
function getFilterOptions(mysqli $conn, string $column, string $table): array
{
    $sql = "SELECT $column FROM $table";
    $result = $conn->query($sql);
    $options = [];

    while ($row = $result->fetch_assoc()) {
        if ($column === 'region') {
            $values = [explode('/', $row[$column])[0]];
        } elseif ($column === 'botanicals') {
            $values = array_map('trim', explode(',', $row[$column]));
        } else {
            $values = [$row[$column]];
        }

        foreach ($values as $value) {
            if ($value !== '' && !in_array($value, $options, true)) {
                $options[] = $value;
            }
        }
    }

    return $options;
}

$regions = getFilterOptions($conn, 'region', 'gins');
$tastes = getFilterOptions($conn, 'taste', 'gins');
$botanicals = getFilterOptions($conn, 'botanicals', 'gins');

sort($regions);
sort($tastes);
sort($botanicals);

// Durchschnittliche Bewertungen und Anzahl je Gin in einer Abfrage laden
function fetchRatingsFromDatabase(mysqli $conn): array
{
    $sql = 'SELECT gin_name, COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as rating_count FROM ratings GROUP BY gin_name';
    $result = $conn->query($sql);

    $ratings = [];
    while ($row = $result->fetch_assoc()) {
        $ratings[$row['gin_name']] = [
            'average_rating' => (float) $row['average_rating'],
            'rating_count' => (int) $row['rating_count'],
        ];
    }

    return $ratings;
}

$ratings = fetchRatingsFromDatabase($conn);

// Bewertung speichern
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['gin_name'], $_POST['rating'])) {
    $rating = filter_var($_POST['rating'], FILTER_VALIDATE_INT);

    if (!csrf_validate()) {
        http_response_code(403);
        die('Ungültige Anfrage.');
    }

    if ($rating !== false && $rating >= 1 && $rating <= 5) {
        $stmt = $conn->prepare('INSERT INTO ratings (gin_name, user_id, rating) VALUES (?, ?, ?)');
        $stmt->bind_param('sii', $_POST['gin_name'], $_SESSION['user_id'], $rating);
        $stmt->execute();
        $stmt->close();

        // Redirect, damit die Bewertung beim Neuladen der Seite nicht erneut abgesendet wird
        header('Location: ginperium.php');
        exit;
    }
}

// Alle Gins abrufen
$result = $conn->query('SELECT * FROM gins');
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description"
        content="Entdecke eine große Auswahl an Gin auf Ginperium, meiner eigenen privaten Gin-Seite.">
    <link rel="stylesheet" href="../css/ginperium_styles.css">
    <link rel="icon" type="image/png" href="../Pictures/GinPerium.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../Pictures/GinPerium.png">
    <title>Ginperium</title>
</head>
<body>

    <div id="cookie-banner" class="cookie-banner">
        <div class="cookie-banner-content">
            <p>Hey, ich nutze Cookies! 🍪 <br>
            Um dir auf meiner Website ein optimales Erlebnis zu bieten, setze ich Cookies ein.
            Durch das Surfen auf meiner Seite stimmst du der Verwendung von Cookies gemäß unserer Cookie-Richtlinie zu.🌐✅</p>
            <button id="accept-cookies" class="cookie-banner-button">Akzeptieren</button>
            <button id="decline-cookies" class="cookie-banner-button">Ablehnen</button>
        </div>
    </div>

    <main>
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
                    <button id="SearchButton" type="button" class="filter-button">Filter</button>
                    <a href="logout.php" class="logout-button">Abmelden</a>
                </div>
            </div>

            <?php while ($gin = $result->fetch_assoc()): ?>
                <?php
                $ginRating = $ratings[$gin['name']] ?? ['average_rating' => 0, 'rating_count' => 0];
                ?>
                <div class="GinContainer">
                    <div class="LeftColumn">
                        <img class="BottlePic" src="<?= htmlspecialchars($gin['image']) ?>" alt="<?= htmlspecialchars($gin['name']) ?>">
                        <p class="Region"><?= htmlspecialchars($gin['region']) ?></p>
                        <p class="Taste"><?= htmlspecialchars($gin['taste']) ?></p>
                        <p class="Alc"><?= htmlspecialchars($gin['alcohol']) ?></p>
                        <p class="Cost"><?= htmlspecialchars($gin['cost']) ?></p>
                    </div>
                    <div class="RightColumn">
                        <h2 class="GinName"><?= htmlspecialchars($gin['name']) ?></h2>
                        <p class="Category"><?= htmlspecialchars($gin['category']) ?></p>
                        <p class="Botanicals"><?= htmlspecialchars($gin['botanicals']) ?></p>
                        <p class="Story"><?= htmlspecialchars($gin['story']) ?></p>
                        <img class="PS_pic" src="../Pictures/PerfectServe.svg" alt="Perfect Serve">
                        <p class="Perfect_Serve"><?= htmlspecialchars($gin['perfect_serve']) ?></p>

                        <div class="average-rating">
                            <div class="stars" data-rating="<?= round($ginRating['average_rating']) ?>">
                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                    <span class="star" data-value="<?= $i ?>">&#9734;</span>
                                <?php endfor; ?>
                            </div>
                            <p class="rating-count"><?= $ginRating['rating_count'] ?> Bewertungen</p>
                            <form class="rating-form" method="post">
                                <?= csrf_field() ?>
                                <input type="hidden" name="gin_name" value="<?= htmlspecialchars($gin['name']) ?>">
                                <input type="hidden" name="rating" value="1">
                                <input type="submit" value="Bewerten" class="button-rating">
                            </form>
                        </div>
                    </div>
                </div>
            <?php endwhile; ?>

            <footer>
                <p>&copy; Alexander Hultsch</p>
                <a href="datenschutz.php">Datenschutzerklärung</a>
            </footer>
        </section>
    </main>

    <script src="../js/cookie-banner.js"></script>
    <script src="../js/gin-script.js"></script>
</body>
</html>
