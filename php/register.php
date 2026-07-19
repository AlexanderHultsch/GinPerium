<?php
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
  $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

  $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  $stmt->bind_param("ss", $username, $password);
  $stmt->execute();
  $stmt->close();
  header("Location: ../php/login.php");
  exit;
}

$conn->close();
?>

<!DOCTYPE html>
<html>
<head>
  <title>Registrierung</title>
  <link rel="stylesheet" href="../css/register_styles.css">
</head>
<body>
  <h1>Registrierung</h1>
  <form action="register.php" method="post" class="register-form">
    <label for="username">Benutzername:</label>
    <input type="text" name="username" required><br>
    <label for="password">Passwort:</label>
    <input type="password" name="password" required><br>
    <input type="submit" value="Registrieren">
  </form>
  <p>Bereits registriert? <a href="../php/login.php">Anmelden</a></p>
</body>
</html>