const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/messages.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, character_id TEXT, created_at INTEGER DEFAULT (strftime('%s','now')*1000), updated_at INTEGER DEFAULT (strftime('%s','now')*1000));
  CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, metadata TEXT, created_at INTEGER DEFAULT (strftime('%s','now')*1000), FOREIGN KEY (session_id) REFERENCES sessions(id));
  CREATE INDEX IF NOT EXISTS idx_msg_session ON messages(session_id, created_at);
`);

function getSessionOrCreate(sid, cid = null) {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sid);
  if (row) return row;
  db.prepare('INSERT INTO sessions (id, character_id) VALUES (?, ?)').run(sid, cid);
  return { id: sid, character_id: cid };
}

function saveMessage(sid, role, text, metadata = null) {
  db.prepare('INSERT INTO messages (session_id, role, text, metadata) VALUES (?, ?, ?, ?)').run(sid, role, text, metadata ? JSON.stringify(metadata) : null);
  db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(Date.now(), sid);
}

function getMessages(sid, limit = 50, beforeId = null) {
  let q = 'SELECT * FROM messages WHERE session_id = ?';
  const p = [sid];
  if (beforeId) { q += ' AND id < ?'; p.push(beforeId); }
  q += ' ORDER BY created_at DESC LIMIT ?'; p.push(limit);
  return db.prepare(q).all(...p).reverse().map(r => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
}

module.exports = { db, getSessionOrCreate, saveMessage, getMessages };
