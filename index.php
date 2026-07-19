<?php
session_start();

if (isset($_SESSION['user_id'])) {
  header("Location: /php/ginperium.php");
} else {
  header("Location: /php/login.php");
}
exit;
?>