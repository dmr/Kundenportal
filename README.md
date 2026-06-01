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
npm run dev      # lokaler Dev-Server (http://localhost:5173)
npm run build    # Production-Build nach dist/
npm run preview  # Build lokal ansehen
```

## Deployment (GitHub Pages)

Push auf `main` triggert den Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
Einmalig in den Repo-Einstellungen aktivieren: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

Die App liegt dann unter `https://<user>.github.io/Kundenportal/`.

- **Base-Path** `/Kundenportal/` ist in `vite.config.js` gesetzt (Repo-Name). Bei Umbenennung anpassen.
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
                        KundeHome, Contract, OrderDetail
```

### Routen

| Pfad | Sicht | Inhalt |
|---|---|---|
| `/` | — | Pseudo-Login (Sichtweise wählen) |
| `/intern` | Team | Übersicht: KPIs, Handlungsbedarf, aktive Vorgänge |
| `/intern/kunden`, `/intern/kunden/:custId` | Team | Kundenliste / Vorgänge eines Kunden |
| `/intern/posteingang` | Team | Anfragen & offene Rückfragen |
| `/kunde` | Kunde | Meine Aufträge + Rahmenvertrags-Budget |
| `/kunde/rahmenvertrag` | Kunde | Budget + eingesetzte Detailerweiterungen |
| `/auftrag/:ordId` | beide | Auftragsdetail (Stepper, Angebot/Bestellung, Positionen) |
