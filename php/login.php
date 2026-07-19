<?php
session_start();
$servername = "rdbms.strato.de";
$username = "dbu2657325";
$password = "StratoGoq2czhnf*";
$dbname = "dbs10509076";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
  $username = $_POST['username'];
  $password = $_POST['password'];

  $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = ?");
  $stmt->bind_param("s", $username);
  $stmt->execute();
  $stmt->bind_result($user_id, $hash);
  $stmt->fetch();
  $stmt->close();

  if (password_verify($password, $hash)) {
    $_SESSION['user_id'] = $user_id;
    header("Location: ../php/ginperium.php");
    exit;
  } else {
    $error = "Benutzername oder Passwort ungültig";
  }
}

$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
  <title>Anmeldung</title>
  <link rel="stylesheet" href="../css/login_styles.css">
</head>

<body>
  
  <div id="cookie-banner" class="cookie-banner">
    <div class="cookie-banner-content">
      <p>Hey, ich nutze Cookies! 🍪 <br>
        Um dir auf meiner Website ein optimales Erlebnis zu bieten, setzen ich Cookies ein. 
        Durch das Surfen auf meiner Seite stimmst du der Verwendung von Cookies gemäß unserer Cookie-Richtlinie zu.🌐✅</p>
        <button id="accept-cookies" class="cookie-banner-button">Akzeptieren</button>
        <button id="decline-cookies" class="cookie-banner-button">Ablehnen</button>
    </div>
  </div>


  <div class="login-wrapper">
    <h1>Anmeldung</h1>
    <?php if (isset($error)): ?>
      <p style="color: red;"><?php echo $error; ?></p>
    <?php endif; ?>
    <form action="login.php" method="post">
      <label for="username">Benutzername:</label>
      <input type="text" name="username" required><br>
      <label for="password">Passwort:</label>
      <input type="password" name="password" required><br>
      <input type="submit" value="Anmelden">
    </form>
    <p>Noch kein Konto? <a href="register.php">Registrieren</a></p>
  </div>
  
  <footer>
    <p>&copy; Alexander Hultsch</p>
    <a href="../php/datenschutz.php">Datenschutzerklärung</a>
  </footer>
  
</body>
</html>
