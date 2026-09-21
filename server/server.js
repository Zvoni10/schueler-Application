// Schüler-App – Backend mit echter SQLite-Datenbank.
// Speichert Konten (Benutzername + gehashtes Passwort), Profile und App-Daten
// (Fächer, Noten, Termine, Aufgaben, Notizen, Stundenplan) je Konto.

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, "school.db");

// ---------- Datenbank ----------------------------------------------------
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS profiles (
    username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    name TEXT,
    avatar TEXT
  );
  CREATE TABLE IF NOT EXISTS app_data (
    username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    remember INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(username);
`);

function emptyData() {
  return { subjects: [], grades: [], events: [], tasks: [], notes: [], schedule: [], flashcards: [] };
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 64).toString("hex");
}

// ---------- Sessions (in der Datenbank, überleben Server-Neustarts) -------
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const SESSION_SHORT = 1 * DAY;    // ohne "Für immer angemeldet bleiben"
const SESSION_LONG = 365 * DAY;   // mit Haken; verlängert sich bei jeder Nutzung

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSession(username, remember) {
  const token = randomHex(32);
  db.prepare("INSERT INTO sessions (token_hash, username, remember, expires_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), username, remember ? 1 : 0, Date.now() + (remember ? SESSION_LONG : SESSION_SHORT));
  return token;
}

function cleanupSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
}
cleanupSessions();
setInterval(cleanupSessions, HOUR).unref();

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const hash = token ? hashToken(token) : null;
  const row = hash ? db.prepare("SELECT username, remember, expires_at FROM sessions WHERE token_hash = ?").get(hash) : null;
  if (!row || row.expires_at < Date.now()) {
    if (row) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash);
    return res.status(401).json({ error: "Nicht angemeldet." });
  }
  // Gleitende Laufzeit: bei Nutzung wird der Login wieder verlängert.
  const newExpiry = Date.now() + (row.remember ? SESSION_LONG : SESSION_SHORT);
  if (newExpiry - row.expires_at > HOUR) {
    db.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?").run(newExpiry, hash);
  }
  req.username = row.username;
  req.token = token;
  req.tokenHash = hash;
  next();
}

// ---------- App ------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "6mb" })); // Profilbilder sind Data-URIs

app.post("/api/register", (req, res) => {
  const { username, password, name, remember } = req.body || {};
  const u = normalizeUsername(username);
  if (!/^[a-z0-9_.-]{3,20}$/.test(u)) {
    return res.status(400).json({ error: "Benutzername: 3–20 Zeichen, nur Buchstaben, Zahlen, _ . -" });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: "Das Passwort muss mindestens 6 Zeichen haben." });
  }
  const existing = db.prepare("SELECT username FROM users WHERE username = ?").get(u);
  if (existing) return res.status(409).json({ error: "Dieser Benutzername ist bereits vergeben." });

  const salt = randomHex();
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare("INSERT INTO users (username, salt, password_hash, created_at) VALUES (?, ?, ?, ?)").run(u, salt, passwordHash, now);
    db.prepare("INSERT INTO profiles (username, name, avatar) VALUES (?, ?, ?)").run(u, (name || u).trim(), "");
    db.prepare("INSERT INTO app_data (username, data) VALUES (?, ?)").run(u, JSON.stringify(emptyData()));
  });
  tx();

  const token = createSession(u, remember === true);
  res.json({ token, username: u });
});

app.post("/api/login", (req, res) => {
  const { username, password, remember } = req.body || {};
  const u = normalizeUsername(username);
  const record = db.prepare("SELECT * FROM users WHERE username = ?").get(u);
  if (!record) return res.status(401).json({ error: "Benutzername oder Passwort ist falsch." });
  const hash = hashPassword(password || "", record.salt);
  if (hash !== record.password_hash) return res.status(401).json({ error: "Benutzername oder Passwort ist falsch." });

  const token = createSession(u, remember === true);
  res.json({ token, username: u });
});

app.post("/api/logout", auth, (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(req.tokenHash);
  res.json({ ok: true });
});

app.get("/api/me", auth, (req, res) => {
  const p = db.prepare("SELECT name, avatar FROM profiles WHERE username = ?").get(req.username);
  res.json({ username: req.username, name: p?.name || req.username, avatar: p?.avatar || "" });
});

app.get("/api/profile", auth, (req, res) => {
  const p = db.prepare("SELECT name, avatar FROM profiles WHERE username = ?").get(req.username);
  res.json(p || { name: req.username, avatar: "" });
});

app.put("/api/profile", auth, (req, res) => {
  const { name, avatar } = req.body || {};
  db.prepare("UPDATE profiles SET name = ?, avatar = ? WHERE username = ?").run(name || req.username, avatar || "", req.username);
  res.json({ ok: true });
});

app.get("/api/data", auth, (req, res) => {
  const row = db.prepare("SELECT data FROM app_data WHERE username = ?").get(req.username);
  res.json(row ? JSON.parse(row.data) : emptyData());
});

app.put("/api/data", auth, (req, res) => {
  db.prepare("UPDATE app_data SET data = ? WHERE username = ?").run(JSON.stringify(req.body || emptyData()), req.username);
  res.json({ ok: true });
});

app.post("/api/change-password", auth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const record = db.prepare("SELECT * FROM users WHERE username = ?").get(req.username);
  const currentHash = hashPassword(currentPassword || "", record.salt);
  if (currentHash !== record.password_hash) return res.status(400).json({ error: "Das aktuelle Passwort ist falsch." });
  if (!newPassword || String(newPassword).length < 6) return res.status(400).json({ error: "Das neue Passwort muss mindestens 6 Zeichen haben." });

  const salt = randomHex();
  const passwordHash = hashPassword(newPassword, salt);
  db.prepare("UPDATE users SET salt = ?, password_hash = ? WHERE username = ?").run(salt, passwordHash, req.username);
  // Nach einer Passwortänderung alle anderen Geräte abmelden.
  db.prepare("DELETE FROM sessions WHERE username = ? AND token_hash != ?").run(req.username, req.tokenHash);
  res.json({ ok: true });
});

// ---------- Fertig gebautes Frontend ausliefern ---------------------------
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Schüler-App-Server läuft auf Port ${PORT}`);
  console.log(`  Auf diesem PC:      http://localhost:${PORT}`);
  console.log(`  Aus dem Netzwerk:   http://<IP-Adresse-dieses-PCs>:${PORT}`);
});
