<?php
session_start();
error_reporting(0);
ini_set('display_errors', 0);

define('DB_HOST', 'localhost');
define('DB_NAME', 'google_keylogger');
define('DB_USER', 'root');
define('DB_PASS', '');

define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'admin123');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_SILENT,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    exit;
}
