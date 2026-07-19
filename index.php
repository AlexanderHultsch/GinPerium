<?php
require __DIR__ . '/php/session.php';
start_secure_session();

if (isset($_SESSION['user_id'])) {
    header('Location: /php/ginperium.php');
} else {
    header('Location: /php/login.php');
}
exit;
