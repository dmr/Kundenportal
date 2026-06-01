# Kundenportal — Auftragsportal

Klickbarer Prototyp eines Kunden-Auftragsportals als **Vite + React + React Router**-App,
deploybar auf **GitHub Pages**. Dienstleister bilden Aufträge ihrer Kunden ab; Kunden
verfolgen den Fortschritt (Anfrage → Angebot → Auftrag → Bestellung → Lieferung → Abgeschlossen),
nehmen Positionen an und stellen Rückfragen.

> Prototyp ≠ Produktion. Alle Daten liegen nur im Speicher (Reload = Reset). Vor Go-live:
> echtes Backend, Authentifizierung, serverseitige Sichtbarkeits-/Rollenprüfung, Tests.
> Anforderungen: [`docs/PRD.md`](docs/PRD.md).

## Entwicklung

```bash
npm install
npm run dev      # lokaler Dev-Server (http://localhost:5173/Kundenportal/)
npm test         # Unit-Tests (Vitest) der Kernlogik
npm run build    # Production-Build nach dist/
npm run preview  # Build lokal ansehen
```

## Deployment (GitHub Pages)

Push auf `main` triggert den Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Einmalig in den Repo-Einstellungen aktivieren: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

Die App liegt dann unter `https://<user>.github.io/Kundenportal/`.

- **Base-Path** `/Kundenportal/` ist in `vite.config.js` einheitlich für dev/build/preview gesetzt (Repo-Name). Bei Umbenennung anpassen. Statische Assets unter `public/` (z. B. `public/products/*.jpg`) via `import.meta.env.BASE_URL` referenzieren.
- **HashRouter** (`#/…`) macht Deep-Links ohne Server-Rewrite robust — passend für GitHub Pages.

## Aufbau

```
src/
  main.jsx              HashRouter + StoreProvider
  App.jsx               Routen + Rollen-Guards
  store.jsx             zentraler In-Memory-Store (Daten + Mutationen + Sichtweise)
  data/portal.js        Konstanten (STAGES, Status-Styles) + SEED-Daten + Helfer
  styles.css            komplettes Styling
  components/           Layout (Navigation/Breadcrumb), Stepper/Status, Modals
  pages/                Login, InternHome, Customers, CustomerDetail, Inbox,
                        Kalibrierung, KundeHome, Geraete, OrderDetail
```

### Routen

| Pfad | Sicht | Inhalt |
|---|---|---|
| `/` | — | Pseudo-Login (Sichtweise wählen) |
| `/intern` | Team | Übersicht: KPIs, Handlungsbedarf, aktive Vorgänge |
| `/intern/kunden`, `/intern/kunden/:custId` | Team | Kundenliste / Vorgänge eines Kunden |
| `/intern/posteingang` | Team | Anfragen & offene Rückfragen |
| `/intern/kalibrierung` | Team | Kalibrier-Cockpit: Geräte nach Fälligkeit (überfällig/bald/aktuell) |
| `/kunde` | Kunde | Meine Aufträge (aktiv + abgeschlossen) |
| `/kunde/geraete` | Kunde | Meine Geräte: Kalibrierstatus, Zertifikate, Kalibrierung anfragen |
| `/auftrag/:ordId` | beide | Auftragsdetail (Stepper, Status, Themen, Rückfragen) |

### Kalibrierungsmanagement

Geräte gehören einem Kunden, werden einmal ausgeliefert und im Intervall (typ. 12 Monate)
kalibriert. Fälligkeit/Status (`kalibriert` / `fällig bald` / `überfällig`) werden am Gerät
berechnet (`calibStatus`, `calibNextDue`), nicht im Zertifikat gespeichert. Kundenanfragen sind
**Kalibrierung / Service-Reparatur / Sonstiges** (kein „Auslieferung") und gerätegebunden.
Hintergrund & Quellen: [`.claude/skills/calibration-management`](.claude/skills/calibration-management/SKILL.md).
