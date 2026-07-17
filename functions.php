<?php
require_once __DIR__ . '/config.php';

function getClientIP() {
    $ip = '';
    $headers = [
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'HTTP_CF_CONNECTING_IP',
        'REMOTE_ADDR'
    ];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = $_SERVER[$h];
            if (strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
            break;
        }
    }
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '0.0.0.0';
}

function getGeolocation($ip) {
    if ($ip === '0.0.0.0' || $ip === '127.0.0.1' || $ip === '::1') {
        return ['country' => 'Local', 'city' => 'Localhost', 'lat' => null, 'lon' => null];
    }
    $cacheDir = __DIR__ . '/cache';
    $cacheFile = $cacheDir . '/' . md5($ip) . '.json';
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < 86400) {
        return json_decode(file_get_contents($cacheFile), true);
    }
    $ctx = stream_context_create(['http' => ['timeout' => 3, 'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']]);
    $resp = @file_get_contents("http://ip-api.com/json/{$ip}?fields=country,city,lat,lon,status", false, $ctx);
    if ($resp) {
        $data = json_decode($resp, true);
        if (!empty($data['status']) && $data['status'] === 'success') {
            $result = ['country' => $data['country'] ?? '', 'city' => $data['city'] ?? '', 'lat' => $data['lat'] ?? null, 'lon' => $data['lon'] ?? null];
            if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
            @file_put_contents($cacheFile, json_encode($result));
            return $result;
        }
    }
    return ['country' => 'Unknown', 'city' => 'Unknown', 'lat' => null, 'lon' => null];
}

function extractNameFromEmail($email) {
    $local = strstr($email, '@', true);
    if (!$local) return 'User';
    $local = preg_replace('/[._]/', ' ', $local);
    $local = preg_replace('/\d+/', '', $local);
    $local = trim($local);
    if (empty($local)) return 'User';
    return ucwords(strtolower($local));
}

function sanitizeOutput($str) {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

function isAdminAuthenticated() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function requireAdmin() {
    if (!isAdminAuthenticated()) {
        header('Location: admin_login.php');
        exit;
    }
}
