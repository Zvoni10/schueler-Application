// Verbindung zum Server (Express + SQLite-Datenbank).
//
// Läuft alles auf demselben Ursprung (z.B. lokal: Server liefert auch das
// gebaute Frontend aus), reichen relative Pfade wie "/api/...".
//
// Wird das Frontend getrennt gehostet (z.B. auf GitHub Pages) und das
// Backend woanders (z.B. auf Render), muss VITE_API_URL beim Bauen gesetzt
// werden (siehe .env.production), z.B.:
//   VITE_API_URL=https://schueler-app-backend.onrender.com
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const TOKEN_KEY = "schueler-app-token";
const USER_KEY = "schueler-app-user";

let authToken = null;
let onUnauthorized = null;

export function setToken(token) {
  authToken = token;
}

// Wird aufgerufen, wenn der Server einen gespeicherten Login ablehnt (401).
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function stores() {
  const list = [];
  try { list.push(window.localStorage); } catch {}
  try { list.push(window.sessionStorage); } catch {}
  return list;
}

// Gespeicherten Login lesen (dauerhaft in localStorage oder nur für die
// aktuelle Browser-Sitzung in sessionStorage).
export function getStoredSession() {
  for (const store of stores()) {
    try {
      const token = store.getItem(TOKEN_KEY);
      if (token) return { token, username: store.getItem(USER_KEY) || "" };
    } catch {}
  }
  return null;
}

// remember = true  -> "Für immer angemeldet bleiben" (localStorage)
// remember = false -> nur bis der Browser/Tab geschlossen wird (sessionStorage)
export function persistSession({ token, username, remember }) {
  clearSession();
  try {
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, username || "");
  } catch {}
}

export function clearSession() {
  for (const store of stores()) {
    try {
      store.removeItem(TOKEN_KEY);
      store.removeItem(USER_KEY);
    } catch {}
  }
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Keine Verbindung zum Server.");
  }
  let body = {};
  try {
    body = await res.json();
  } catch {}
  if (!res.ok) {
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    const err = new Error(body.error || "Der Server hat einen Fehler gemeldet.");
    err.status = res.status;
    throw err;
  }
  return body;
}

export async function registerUser(username, password, name, remember = false) {
  const { token, username: u } = await apiFetch("/api/register", {
    method: "POST",
    body: JSON.stringify({ username, password, name, remember }),
  });
  setToken(token);
  return { token, username: u };
}

export async function loginUser(username, password, remember = false) {
  const { token, username: u } = await apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password, remember }),
  });
  setToken(token);
  return { token, username: u };
}

export async function logoutUser() {
  try {
    await apiFetch("/api/logout", { method: "POST" });
  } catch {}
  setToken(null);
}

export function fetchMe() {
  return apiFetch("/api/me");
}

export function fetchProfile() {
  return apiFetch("/api/profile");
}

export function saveProfile(profile) {
  return apiFetch("/api/profile", { method: "PUT", body: JSON.stringify(profile) });
}

export function fetchData() {
  return apiFetch("/api/data");
}

export function saveData(data) {
  return apiFetch("/api/data", { method: "PUT", body: JSON.stringify(data) });
}

export function changePassword(currentPassword, newPassword) {
  return apiFetch("/api/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
