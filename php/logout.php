<?php
require __DIR__ . '/session.php';
start_secure_session();

$_SESSION = [];
session_destroy();

header('Location: login.php');
exit;
