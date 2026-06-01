---
name: calibration-management
description: >-
  Domänenwissen & Muster für Kalibrierungsmanagement / Messmittelverwaltung in einem
  Dienstleister-Kundenportal — Geräteregister, Kalibrierintervalle & Fälligkeit/Recall,
  Durchführung (in/außerhalb Toleranz, As-found/As-left), Zertifikate & Rückführbarkeit
  (ISO 17025), Kunden-Self-Service und Anfrage-Taxonomie. Recherchebasiert (Beamex, Fluke,
  Qualer, Keysight, SIMCO u. a.). Verwenden, wenn Geräte/Kalibrierungen/Zertifikate, deren
  Status/Fälligkeit, oder der Anfrage-Workflow für Kalibrierung modelliert oder gebaut werden.
---

# Kalibrierungsmanagement — Domänen- & UX-Leitlinien

Recherchierte, zitierte Muster für Kalibrier-/Messmittelverwaltung in einem Kundenportal.
Bei Arbeiten an Geräten, Fälligkeiten, Zertifikaten oder Kalibrier-Anfragen zuerst hier nachsehen.

## Kernprinzip

Ein **Gerät (Asset)** gehört genau einem Kunden. Es wird einmal **ausgeliefert** (Onboarding,
Dienstleister-initiiert) und danach im **Intervall** (typ. 12 Monate) **kalibriert**. Fälligkeit
ist eine **Berechnung am Gerät**, kein Zertifikatsfeld. Der Kunde sieht im Portal seine Geräte,
deren Status und Zertifikate (read-only) und **fragt** Kalibrierung/Reparatur **an** — asset-gebunden.

## 1. Geräteregister (Asset Register)

- **Eindeutige Geräte-ID als Anker** für alle Kalibrierdatensätze/Zertifikate/Etiketten. [GAGEtrak]
- **Stammdaten:** Bezeichnung, Hersteller, Typ/Modell, Seriennummer, interne ID, Kunde/Standort, **Auslieferdatum** (= Start des Kalibrierzyklus). [Beamex CMX]
- **Kundenzuordnung = Mandantengrenze:** Portal filtert ausschließlich auf die Assets des Kunden. [Qualer]
- **Eignung/Fitness-for-use** (Bereich, Auflösung, Unsicherheit) dokumentieren (ISO 17025). [SIMCO]

## 2. Intervalle & Fälligkeit / Recall

- **Nächste Fälligkeit = letzte Kalibrierung + Intervall** (bei Erstkalibrierung relativ zur Auslieferung). [Gaugify, 1factory]
- **Drei Kernstatus + Vorwarnschwelle:** kalibriert · bald fällig (`due_soon`, z. B. 30–60 Tage) · überfällig. [Gaugify, Qualer]
- **Gestaffelte Recall-/Reminder-Schwellen** (z. B. 90/30/14/7 Tage). [Gaugify]
- **Intervallhoheit beim Kunden/Vertrag** — das Labor empfiehlt kein Intervall ungefragt (ILAC-G24). [Fluke, SIMCO]
- **Fälligkeit ist App-Berechnung**, kein Feld auf dem Zertifikat. [Fluke, Elsmar]

## 3. Durchführung & Ergebnis

- **Toleranzgrenze entscheidet Pass/Fail:** Fehler > Akzeptanzgrenze ⇒ „außerhalb Toleranz". [Beamex]
- **As-Found vor As-Left** erfassen (Zustand bei Anlieferung / nach Justage). [IndySoft]
- **Messunsicherheit** fließt in die Konformitätsaussage ein. [Beamex, SIMCO]
- **Bei Nichtbestehen:** Justage + Rückwirkungs-/Impact-Analyse auf frühere Messungen. [Beamex, In Compliance]

## 4. Zertifikate & Rückführbarkeit

- **Lückenlose Rückführung zu SI-Einheiten** (ISO 17025 §6.5). [RJ Quality, ISOBudgets]
- **Zertifikat-Pflichtinhalte:** eindeutige Nr., Geräte-ID, Kalibrierdatum, genutzte Normale, Bedingungen, Ergebnis + Unsicherheit, Konformitätsaussage, Unterzeichner. [QualityMag, Beamex]
- **Vollständige, unveränderliche Historie pro Gerät** + Audit-Trail. [Beamex CMX, SIMCO]
- **Kein Fälligkeits-/Ablaufdatum im Zertifikat** (außer kundenseitig vereinbart). [Fluke, Elsmar]

## 5. Kunden-Self-Service

- **Sichten, nicht editieren:** Geräte + Status sehen, Zertifikate (aktuell + Historie) herunterladen; Stammdaten/Ergebnisse bleiben dienstleisterseitig. [Qualer]
- **Anfrage direkt aus dem Asset heraus** starten (Default-Service vorkonfigurierbar). [Keysight]
- **Status-Tracking über Phasen:** angefragt → terminiert/eingegangen → in Kalibrierung → abgeschlossen (Zertifikat verfügbar). [Keysight, Qualer]

## 6. Anfrage-Taxonomie aus Kundensicht

- **Kundenanfragen = Kalibrierung (Default), Reparatur/Service, optional Wartung.** [Keysight, Qualer, TSI]
- **Jede Anfrage ist asset-gebunden** (Auswahl eines bestehenden Geräts). [Keysight]
- **„Auslieferung" ist KEINE Kundenanfrage** — sie ist ein dienstleister-seitiger Onboarding-Event, der das Gerät erst anlegt und den Zyklus startet. Der Kunde kann nichts anfragen, das er noch nicht besitzt. [Keysight, Qualer]

## Anwendung in diesem Repo

- **Datenmodell `Gerät`** (`src/data/portal.js` → `SEED.geraete`): `id, customerId, bezeichnung, hersteller, typ, seriennummer, ausgeliefert, kalibrierIntervallMonate, letzteKalibrierung, zertifikate[]`.
- **Fälligkeit/Status pur & testbar:** `calibNextDue(g)`, `calibStatus(g, today)` mit `CALIB_DUE_SOON_DAYS = 60`. Status-Styles für „kalibriert/fällig bald/überfällig" und „in/außerhalb Toleranz".
- **Zertifikat** je Kalibrierung: `{ nr, datum, ergebnis, gueltigBis }`; `gueltigBis = letzte + Intervall` lebt am Gerät. `addCalibration()` schreibt Historie + Fälligkeit fort.
- **Seiten:** Kunde `Meine Geräte` (`/kunde/geraete`), intern `Kalibrierung`-Cockpit (`/intern/kalibrierung`, gruppiert nach Status, Überfällig-Badge in der Nav). Gerätedetail als Sheet mit Historie; intern „Kalibrierung erfassen", Kunde „Kalibrierung anfragen".
- **Anfrage-Taxonomie** (`NewAnfrageSheet`): Kalibrierung / Service-Reparatur / Sonstiges — **kein** „Auslieferung". Kalibrier-Anfrage ist gerätegebunden (`order.geraetId`).

## Quellen

- Beamex — CMX, Out-of-Tolerance, What is calibration: https://www.beamex.com/calibration-software/cmx/ · https://blog.beamex.com/calibration-out-of-tolerance-what-is-it-and-what-to-do-next-part-1-of-2 · https://www.beamex.com/resources/what-is-calibration/
- Fluke — Calibration Intervals: https://www.fluke.com/en-us/learn/blog/temperature-calibration/establishing-correct-calibration-intervals
- Qualer (Kundenportal/Work-Orders): https://qualer.com/ · https://qualer.com/work-order-management-system/
- Keysight — Create/Track Service Order: https://docs.keysight.com/kkbopen/create-and-track-a-service-order-calibration-or-repair-656952657.html
- Gaugify — Calibration Recall System: https://www.gaugify.io/blog/what-is-a-calibration-recall-system
- IndySoft — As-Found/As-Left: https://indysoft.helpdocsite.com/document-creation/as-found-and-as-left-certificate-indicators
- SIMCO — ISO 17025 Audit Guide: https://www.simco.com/blog/iso-17025-calibration-audit-guide/
- QualityMag — Read ISO/IEC 17025 Certificates: https://www.qualitymag.com/articles/98235-how-to-read-and-interpret-iso-iec-17025-calibration-certificates
- ISOBudgets / RJ Quality — Traceability: https://www.isobudgets.com/measurement-traceability-complying-iso-17025-requirements/ · https://rjqualityconsulting.com/measurement-traceability
- Elsmar — No Expiry Date on Certificate: https://elsmar.com/elsmarqualityforum/threads/never-put-an-expiration-due-date-on-a-calibration-certificate.21953/
- GAGEtrak / 1factory: https://gagetrak.com/ · https://www.1factory.com/gage-calibration.html
