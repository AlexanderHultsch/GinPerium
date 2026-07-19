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

        $conn = get_db_connection();
        $stmt = $conn->prepare('SELECT id, password FROM users WHERE username = ?');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $stmt->bind_result($userId, $hash);
        $userFound = $stmt->fetch();
        $stmt->close();

        if ($userFound && password_verify($password, $hash)) {
            session_regenerate_id(true);
            $_SESSION['user_id'] = $userId;
            header('Location: ginperium.php');
            exit;
        }

        $error = 'Benutzername oder Passwort ungültig';
    }
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anmeldung | Ginperium</title>
  <link rel="stylesheet" href="../css/login_styles.css">
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

  <div class="login-wrapper">
    <h1>Anmeldung</h1>
    <?php if ($error !== null): ?>
      <p style="color: red;"><?= htmlspecialchars($error) ?></p>
    <?php endif; ?>
    <form action="login.php" method="post">
      <?= csrf_field() ?>
      <label for="username">Benutzername:</label>
      <input type="text" id="username" name="username" required autocomplete="username"><br>
      <label for="password">Passwort:</label>
      <input type="password" id="password" name="password" required autocomplete="current-password"><br>
      <input type="submit" value="Anmelden">
    </form>
    <p>Noch kein Konto? <a href="register.php">Registrieren</a></p>
  </div>

  <footer>
    <p>&copy; Alexander Hultsch</p>
    <a href="datenschutz.php">Datenschutzerklärung</a>
  </footer>

  <script src="../js/cookie-banner.js"></script>
</body>
</html>
