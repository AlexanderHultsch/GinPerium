<?php
/**
 * Startet die Session mit abgesicherten Cookie-Parametern
 * (HttpOnly, SameSite, Secure bei HTTPS).
 */
function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);

    session_start();
}

function require_login(string $loginUrl = 'login.php'): void
{
    if (!isset($_SESSION['user_id'])) {
        header('Location: ' . $loginUrl);
        exit;
    }
}
