const path = require('path');
const fs = require('fs');

let client;
let dialect;

if (process.env.TURSO_DATABASE_URL) {
  // Production: Turso (cloud SQLite over HTTP)
  const { createClient } = require('@libsql/client');
  dialect = 'turso';
  client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
} else {
  // Local: Node's built-in SQLite (Node 22.5+), zero install
  const { DatabaseSync } = require('node:sqlite');
  dialect = 'local';
  const DATA_DIR = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  client = new DatabaseSync(path.join(DATA_DIR, 'dekon.db'));
  client.exec('PRAGMA journal_mode = WAL;');
  client.exec('PRAGMA foreign_keys = ON;');
}

function norm(statement) {
  return statement.trim().replace(/\s+/g, ' ');
}

async function exec(statement) {
  if (dialect === 'turso') {
    // Turso only runs one statement per call; split on semicolons.
    const parts = statement.split(';').map(norm).filter(Boolean);
    for (const p of parts) await client.execute(p);
  } else {
    client.exec(statement);
  }
}

// Unified prepared-statement API that works for both drivers.
function prepare(sql) {
  if (dialect === 'turso') {
    return {
      async get(...params) {
        const r = await client.execute({ sql, args: params });
        return r.rows[0] || undefined;
      },
      async all(...params) {
        const r = await client.execute({ sql, args: params });
        return r.rows || [];
      },
      async run(...params) {
        const r = await client.execute({ sql, args: params });
        // bigint -> number for convenience
        const id = r.lastInsertRowid;
        return { lastInsertRowid: typeof id === 'bigint' ? Number(id) : id, changes: r.rowsAffected };
      },
    };
  }
  // node:sqlite is synchronous. Wrap in async to match the same interface.
  const stmt = client.prepare(sql);
  return {
    async get(...params) { return stmt.get(...params); },
    async all(...params) { return stmt.all(...params); },
    async run(...params) { return stmt.run(...params); },
  };
}

// Schema is created on demand at server boot (see initSchema).
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id     TEXT UNIQUE,
    avatar_url    TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    date        TEXT NOT NULL,
    description TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('income','expense')),
    category    TEXT NOT NULL,
    amount      REAL NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS budgets (
    user_id  INTEGER NOT NULL,
    category TEXT NOT NULL,
    limit_amount REAL NOT NULL,
    PRIMARY KEY (user_id, category),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

async function initSchema() {
  await exec(SCHEMA);
}

module.exports = { prepare, exec, initSchema, dialect };
