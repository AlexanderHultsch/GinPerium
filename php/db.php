<?php
/**
 * Stellt eine gemeinsam genutzte mysqli-Verbindung bereit.
 * Die Zugangsdaten kommen aus der nicht versionierten config.php
 * (siehe config.example.php für die Vorlage).
 */
function get_db_connection(): mysqli
{
    static $conn = null;

    if ($conn !== null) {
        return $conn;
    }

    $configFile = __DIR__ . '/config.php';
    if (!is_file($configFile)) {
        http_response_code(500);
        die('Konfiguration fehlt: Bitte php/config.example.php nach php/config.php kopieren und ausfüllen.');
    }

    $config = require $configFile;

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    try {
        $conn = new mysqli($config['db_host'], $config['db_user'], $config['db_pass'], $config['db_name']);
        $conn->set_charset('utf8mb4');
    } catch (mysqli_sql_exception $e) {
        error_log('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage());
        http_response_code(500);
        die('Die Datenbank ist derzeit nicht erreichbar. Bitte versuche es später erneut.');
    }

    return $conn;
}
