const path = require('path');

const DB_PATH = path.join(__dirname, 'lostfound.db');

let db;
try {
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = DELETE');
  db.exec('PRAGMA foreign_keys = ON');
} catch (e) {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');
}

db.exec(`
CREATE TABLE IF NOT EXISTS Users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  roll_no TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  contact TEXT,
  photo_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Categories (
  category_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Items (
  item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('lost','found')),
  name TEXT NOT NULL,
  category_id INTEGER,
  description TEXT,
  location TEXT,
  item_date TEXT,
  image_path TEXT,
  contact_info TEXT,
  hidden_verification TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  reported_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Claims (
  claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  claimant_id INTEGER NOT NULL,
  lost_location TEXT,
  approx_datetime TEXT,
  claim_description TEXT,
  unique_features TEXT,
  extra_info TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (claimant_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS UserReports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  reported_user_id INTEGER NOT NULL,
  reporter_id INTEGER NOT NULL,
  claim_id INTEGER,
  item_id INTEGER,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reported_user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (claim_id) REFERENCES Claims(claim_id) ON DELETE SET NULL,
  FOREIGN KEY (item_id) REFERENCES Items(item_id) ON DELETE SET NULL
);
`);

// Migrations for existing Users tables
try {
  const cols = db.prepare("PRAGMA table_info(Users)").all().map(c => c.name);
  if (!cols.includes('photo_path')) db.exec('ALTER TABLE Users ADD COLUMN photo_path TEXT');
  if (!cols.includes('blocked')) db.exec('ALTER TABLE Users ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0');
  if (!cols.includes('blocked_reason')) db.exec('ALTER TABLE Users ADD COLUMN blocked_reason TEXT');
} catch (e) { /* ignore */ }

const catCount = db.prepare('SELECT COUNT(*) AS c FROM Categories').get().c;
if (catCount === 0) {
  const insert = db.prepare('INSERT INTO Categories (category_name) VALUES (?)');
  ['Electronics', 'ID Cards', 'Books & Notes', 'Accessories', 'Clothing', 'Wallets & Keys', 'Water Bottles', 'Umbrellas', 'Others'].forEach(c => insert.run(c));
}

const adminExists = db.prepare("SELECT COUNT(*) AS c FROM Users WHERE role='admin'").get().c;
if (adminExists === 0) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO Users (name,email,roll_no,password_hash,role,contact,photo_path) VALUES (?,?,?,?,?,?,?)')
    .run('Administrator', 'admin@campus.edu', 'ADMIN001', hash, 'admin', '9999999999', null);
}

module.exports = db;
