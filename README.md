# Schüler-App

## 🌐 Online-Version (GitHub Pages + Render)

Die App läuft jetzt in zwei getrennten Teilen online:

- **Frontend** wird automatisch per GitHub Actions auf **GitHub Pages**
  veröffentlicht (Workflow: `.github/workflows/deploy-pages.yml`).
- **Backend** (Node/Express + SQLite) läuft separat auf **Render**
  (kostenloser Plan reicht) - Konfiguration in `render.yaml`.

Die genaue Schritt-für-Schritt-Anleitung dafür steht im Chat, in dem diese
Dateien erstellt wurden. Kurzfassung:

1. Code in ein GitHub-Repository pushen.
2. Backend auf [render.com](https://render.com) als "Web Service" aus dem
   Repo erstellen (Root-Verzeichnis `server`, Render erkennt die
   `render.yaml` automatisch). Die Render-URL danach kopieren.
3. In den GitHub-Repo-Einstellungen unter **Settings → Secrets and
   variables → Actions** ein Secret `VITE_API_URL` mit dieser Render-URL
   anlegen.
4. In **Settings → Pages** als Quelle "GitHub Actions" auswählen.
5. Bei jedem Push auf `main` wird das Frontend automatisch neu gebaut und
   veröffentlicht.

Die Seite ist danach unter `https://<dein-github-name>.github.io/<repo-name>/`
erreichbar - auf jedem Gerät (Handy, Laptop, Tablet) mit Internetzugang.

---

# Schüler-App – lokale Installation mit Server & Datenbank

Diese App besteht aus zwei Teilen:

- **`server/`** – ein kleiner Node.js-Server (Express), der eine echte
  **SQLite-Datenbank** (`server/school.db`) verwaltet: Benutzerkonten
  (Benutzername + sicher gehashtes Passwort), Profile und alle App-Daten
  (Fächer, Noten, Termine, Aufgaben, Notizen, Stundenplan).
- **`client/`** – die React-Oberfläche (Vite-Projekt), die sich über eine
  kleine API mit dem Server verbindet.

Am Ende läuft **ein Server auf deinem PC**, den du (und jedes andere Gerät
in deinem WLAN/Netzwerk, z. B. Handy oder Laptop) über den Browser
aufrufen könnt – mit echter Registrierung/Anmeldung, und alle Konten teilen
sich dieselbe Datenbank.

## Voraussetzungen

- **Node.js** (Version 18 oder neuer) – falls noch nicht installiert:
  https://nodejs.org (LTS-Version herunterladen und installieren).
  Prüfen, ob es funktioniert: `node --version` in einer Konsole/Terminal.

## 1. Installation

Öffne ein Terminal (Windows: PowerShell oder CMD; macOS/Linux: Terminal)
im entpackten Projektordner `schueler-app` und führe aus:

```bash
cd server
npm install
cd ../client
npm install
```

> Hinweis für `better-sqlite3` (die Datenbank-Bibliothek im Server):
> Meistens installiert sich das ohne Probleme, da fertige Binärdateien
> mitgeliefert werden. Falls bei `npm install` im `server`-Ordner ein
> Compiler-Fehler auftritt, unter Windows die "Desktop development with
> C++"-Komponente der Visual Studio Build Tools nachinstallieren, unter
> macOS `xcode-select --install` ausführen.

## 2. Frontend bauen

```bash
cd client
npm run build
```

Das erzeugt die fertige Oberfläche direkt im Ordner `server/public`.

## 3. Server starten

```bash
cd ../server
npm start
```

Im Terminal erscheint etwas wie:

```
Schüler-App-Server läuft auf Port 4000
  Auf diesem PC:      http://localhost:4000
  Aus dem Netzwerk:   http://<IP-Adresse-dieses-PCs>:4000
```

Öffne `http://localhost:4000` im Browser – dort siehst du die
Anmelde-/Registrierungsseite. Um von einem anderen Gerät im selben
WLAN zuzugreifen, findest du deine PC-IP z. B. mit `ipconfig` (Windows)
oder `ifconfig` / `ip a` (macOS/Linux) heraus und rufst
`http://<diese-IP>:4000` im Browser des anderen Geräts auf.

Die Datenbankdatei `server/school.db` wird beim ersten Start automatisch
angelegt – dort liegen alle Konten und Daten dauerhaft.

## Täglich nutzen

Sobald `server/public` einmal gebaut ist, reicht danach für den normalen
Gebrauch nur noch:

```bash
cd server
npm start
```

Nur wenn du später Änderungen am Code der Oberfläche (`client/`) machst,
musst du `npm run build` im `client`-Ordner erneut ausführen.

## Entwicklungsmodus (optional)

Wenn du selbst am Code weiterbasteln willst, kannst du Server und
Client parallel im Entwicklungsmodus laufen lassen (mit automatischem
Neuladen bei Änderungen):

```bash
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm run dev
```

Der Vite-Entwicklungsserver läuft dann meist auf `http://localhost:5173`
und leitet API-Anfragen automatisch an den Server auf Port 4000 weiter.

## Als Desktop-Programm starten (optional)

Falls du die App später wie ein "richtiges" installiertes Programm
(mit eigenem Fenster statt Browser-Tab) haben möchtest, lässt sich das
mit einem Werkzeug wie **Electron** oder **Tauri** um den Server bzw.
das gebaute Frontend herum verpacken – sag einfach Bescheid, dann bauen
wir das als nächsten Schritt.
