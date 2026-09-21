# Schüler-App – Update 2.0

Modernisierte Schüler-App mit:
- überarbeitetem Dashboard mit Schnellaktionen und klaren Statistikkarten
- neuem Lerncenter mit Pomodoro-/Fokus-Timer
- Lernkarten mit Frage/Antwort und Fachzuordnung
- responsiver Mobile-Navigation und Bottom-Sheet-Dialogen
- verbessertem Fokus-/Hover-/Card-Design
- vollständigem Vite-Einstiegspunkt (`main.jsx`) und Build-Konfiguration
- SQLite-Backend mit Speicherung der neuen Lernkarten

## Start

```bash
npm install
npm run build
npm start
```

Danach: `http://localhost:4000`

Für die Entwicklung:
```bash
npm run dev
```

## Schulio Administration

Auf einer neuen Installation wird automatisch ein Administratorkonto angelegt:

- Benutzername: `Organisator` (Login ist nicht case-sensitive)
- Standardpasswort: `SchulioAdmin2026!`
- Rolle: `admin`

Für einen produktiven Server kann das Passwort über die Umgebungsvariable `SCHULIO_ADMIN_PASSWORD` gesetzt werden. Das Administratorkonto kann in Schulio unter **Administration** alle erstellten Accounts sehen und Mitteilungen an alle anderen Konten in deren **MailBox** senden.

Persönliche Einstellungen wie Sprache, Darstellung, kompakte Ansicht, reduzierte Animationen und Startseite werden pro Benutzer in der Datenbank gespeichert.
