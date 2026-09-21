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

let authToken = null;

export function setToken(token) {
  authToken = token;
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function persistToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let body = {};
  try {
    body = await res.json();
  } catch {}
  if (!res.ok) throw new Error(body.error || "Der Server hat einen Fehler gemeldet.");
  return body;
}

export async function registerUser(username, password, name) {
  const { token, username: u } = await apiFetch("/api/register", {
    method: "POST",
    body: JSON.stringify({ username, password, name }),
  });
  setToken(token);
  return { token, username: u };
}

export async function loginUser(username, password) {
  const { token, username: u } = await apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
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
