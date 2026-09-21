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
`);

function emptyData() {
  return { subjects: [], grades: [], events: [], tasks: [], notes: [], schedule: [] };
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

// ---------- Sessions (einfache Token im Arbeitsspeicher) -----------------
const sessions = new Map(); // token -> username

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const username = token ? sessions.get(token) : null;
  if (!username) return res.status(401).json({ error: "Nicht angemeldet." });
  req.username = username;
  req.token = token;
  next();
}

// ---------- App ------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json({ limit: "6mb" })); // Profilbilder sind Data-URIs

app.post("/api/register", (req, res) => {
  const { username, password, name } = req.body || {};
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

  const token = randomHex(24);
  sessions.set(token, u);
  res.json({ token, username: u });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const u = normalizeUsername(username);
  const record = db.prepare("SELECT * FROM users WHERE username = ?").get(u);
  if (!record) return res.status(401).json({ error: "Benutzername oder Passwort ist falsch." });
  const hash = hashPassword(password || "", record.salt);
  if (hash !== record.password_hash) return res.status(401).json({ error: "Benutzername oder Passwort ist falsch." });

  const token = randomHex(24);
  sessions.set(token, u);
  res.json({ token, username: u });
});

app.post("/api/logout", auth, (req, res) => {
  sessions.delete(req.token);
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
