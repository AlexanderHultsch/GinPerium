<?php
require __DIR__ . '/session.php';
require __DIR__ . '/db.php';
require __DIR__ . '/csrf.php';

start_secure_session();

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_validate()) {
        $error = 'Ungültige Anfrage. Bitte lade die Seite neu und versuche es erneut.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        if ($username === '' || $password === '') {
            $error = 'Benutzername und Passwort dürfen nicht leer sein.';
        } elseif (strlen($password) < 8) {
            $error = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
        } else {
            $conn = get_db_connection();

            $stmt = $conn->prepare('SELECT id FROM users WHERE username = ?');
            $stmt->bind_param('s', $username);
            $stmt->execute();
            $stmt->store_result();
            $usernameTaken = $stmt->num_rows > 0;
            $stmt->close();

            if ($usernameTaken) {
                $error = 'Dieser Benutzername ist bereits vergeben.';
            } else {
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $conn->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
                $stmt->bind_param('ss', $username, $hashedPassword);
                $stmt->execute();
                $stmt->close();
                header('Location: login.php');
                exit;
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registrierung | Ginperium</title>
  <link rel="stylesheet" href="../css/register_styles.css">
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

  <div class="register-wrapper">
    <h1>Registrierung</h1>
    <?php if ($error !== null): ?>
      <p style="color: red;"><?= htmlspecialchars($error) ?></p>
    <?php endif; ?>
    <form action="register.php" method="post" class="register-form">
      <?= csrf_field() ?>
      <label for="username">Benutzername:</label>
      <input type="text" id="username" name="username" required autocomplete="username"><br>
      <label for="password">Passwort:</label>
      <input type="password" id="password" name="password" required minlength="8" autocomplete="new-password"><br>
      <input type="submit" value="Registrieren">
    </form>
    <p>Bereits registriert? <a href="login.php">Anmelden</a></p>
  </div>

  <footer>
    <p>&copy; Alexander Hultsch</p>
    <a href="datenschutz.php">Datenschutzerklärung</a>
  </footer>

  <script src="../js/cookie-banner.js"></script>
</body>
</html>
