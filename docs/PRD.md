# PRD — Kunden-Auftragsportal

| | |
|---|---|
| **Produkt** | Kunden-Auftragsportal |
| **Version** | Prototyp v5 (klickbare Vision) |
| **Datum** | 2026-06-01 |
| **Status** | Prototyp – nicht produktiv. Vor Go-live: Security-Review, serverseitige Validierung & Sichtbarkeit, Auth, Fehlerbehandlung, Tests. |

---

## 1. Ziel & Kontext

Ein Portal, in dem ein Dienstleister die Aufträge seiner Kunden übersichtlich abbildet und Kunden den Fortschritt ihrer Aufträge transparent verfolgen. Pro Kunde existieren mehrere Vorgänge (z. B. „TLW 763 / 5069 Auslieferung", „TLW 823 / 5070 Service"). Zu jedem Vorgang gehören Angebot, Bestellung, Lieferschein, Positionen mit Teilaufgaben sowie Kommunikation/Rückfragen.

**Kernnutzen:** Der Kunde sieht jederzeit, wie weit sein Auftrag erfüllt ist, ob seine Anfrage noch keinen Auftrag bzw. noch keine Bestellung hat, und kann Positionen annehmen oder Rückfragen stellen. Intern wird derselbe Vorgang mit zusätzlichen, nicht sichtbaren Details gepflegt.

## 2. Rollen / Sichtweisen

Zugang im Prototyp über einen Pseudo-Login (Sichtweise-Auswahl, keine echte Authentifizierung).

- **Intern (Team):** sieht alle Kunden und Vorgänge, pflegt Positionen, Teilaufgaben und interne Planung, setzt den Status und beantwortet Rückfragen.
- **Kunde:** sieht nur eigene Vorgänge, den Fortschritt, freigegebene Teilaufgaben und den Rahmenvertrag; kann Positionen annehmen, Rückfragen stellen und neue Anfragen einreichen.

## 3. Funktionen (User Stories)

- Als **Kunde** will ich den Fortschritt meines Auftrags sehen (Anfrage → Angebot → Auftrag → Bestellung → Lieferung → Abgeschlossen), damit ich weiß, wie weit er erfüllt ist.
- Als **Kunde** will ich erkennen, wenn meine Anfrage noch keinen Auftrag oder noch keine Bestellung hat.
- Als **Kunde** will ich einzelne Angebotspositionen annehmen oder eine Rückfrage direkt an einer Position stellen.
- Als **Kunde** will ich mein Service-Rahmenvertrags-Budget (verbleibende Stunden) sehen.
- Als **Kunde** will ich eine neue Anfrage ohne bestehenden Auftrag einreichen.
- Als **Team** will ich Angebot und Bestellung eines Vorgangs auf einer Seite sehen.
- Als **Team** will ich pro Position Teilaufgaben mit Verantwortlichem, Fälligkeit und Status pflegen.
- Als **Team** will ich interne Planungsdaten (interner Liefertermin, Testing-Puffer) pflegen, die der Kunde nicht sieht.
- Als **Team** will ich offene Anfragen und unbeantwortete Rückfragen zentral im Posteingang abarbeiten.

## 4. Screens & Anforderungen

- **Pseudo-Login:** Auswahl der Sichtweise (Intern oder konkreter Kunde).
- **Übersicht (intern):** KPIs (aktive Vorgänge, Handlungsbedarf, offene Angebote), Liste Handlungsbedarf (Anfragen ohne Auftrag, offene Rückfragen), aktive Vorgänge.
- **Meine Aufträge (Kunde):** Rahmenvertrags-Budget-Balken + eigene Vorgänge mit „Schritt x/6"-Anzeige.
- **Kunden / Kundenansicht (intern):** Kundenliste, je Kunde alle Vorgänge.
- **Posteingang (intern):** neue Anfragen und unbeantwortete Rückfragen, direkt in den Vorgang springen.
- **Rahmenvertrag (Kunde):** Budget-Balken + Liste der eingesetzten Detailerweiterungen.
- **Auftragsdetail (eine Seite):** Fortschritts-Stepper + Statusbox; Angebot & Bestellung nebeneinander; Positionen als kompakte Zeilen.
- **Positions-Detail (Modal/Bottom-Sheet):** Beschreibung, Betrag, Annahme-Status, Teilaufgaben (Status per Dropdown, Verantwortlich, Fälligkeit, Sichtbarkeit), Rückfragen-Thread + Antwort, „Position annehmen" (Kunde).
- **Mobil:** Bottom-Tab-Navigation, schlanke Top-Bar, Bottom-Sheets, horizontal scrollbare Tabellen.

## 5. Datenmodell

```
Kunde        : id, name, kontakt, email, ort, rahmenvertrag?
Rahmenvertrag: nr, budgetStunden, eintraege[{ titel, stunden, datum }]
Vorgang      : id, customerId, titel, typ(Auslieferung|Service), tlw?, auftragsNr?,
               stage(anfrage|angebot|auftrag|bestellung|lieferung|abgeschlossen),
               datum, angebot?, bestellung?, lieferschein?, internePlanung[], emails[]
Angebot      : nr, datum, status, positionen[]
Position     : id, titel, betrag, angenommen(bool), beschreibung,
               teilaufgaben[], rueckfragen[]
Teilaufgabe  : id, titel, status(geplant|läuft|erledigt), sicht(kunde|intern),
               verantwortlich, faellig
Rückfrage    : dir(in|out), from, datum, text
Bestellung   : nr, datum, status
Lieferschein : nr, datum, status
InternePlanung: id, titel, datum, status, info
Email        : dir(in|out), from, datum, betreff, body
```

## 6. Geschäftsregeln

- Die Kundensicht zeigt nur Teilaufgaben mit `sicht = kunde`; interne Planung (interner Liefertermin, Testing-Puffer) bleibt vollständig verborgen.
- `stage` steuert die Fortschrittsanzeige: vor `auftrag` ⇒ „noch kein Auftrag", `auftrag` bis vor `bestellung` ⇒ „noch keine Bestellung".
- Nimmt der Kunde **alle** Positionen an, wechselt das Angebot auf `angenommen` und der Vorgang von `angebot` auf `auftrag`.
- Eine neue Anfrage entsteht als Vorgang mit `stage = anfrage`, ohne TLW/Auftragsnummer und ohne Angebot.
- Rückfragen sind entweder an eine Position oder als allgemeine Kommunikation an den Vorgang gebunden.
- Rahmenvertrag: verfügbar = `budgetStunden − Σ eintraege.stunden`.

## 7. Sichtbarkeit (Kunde vs. Intern)

| Inhalt | Kunde | Intern |
|---|---|---|
| Stepper, Status, Angebot/Bestellung, Positionen, Preise | ✅ | ✅ |
| Teilaufgaben mit `sicht=kunde` | ✅ | ✅ |
| Teilaufgaben mit `sicht=intern`, interne Planung | ❌ | ✅ |
| Verantwortliche je Teilaufgabe | ❌ | ✅ |
| Status setzen / Teilaufgaben pflegen / löschen | ❌ | ✅ |
| Position annehmen / Rückfrage stellen | ✅ | (beantworten) |

## 8. Nicht-Ziele (diese Phase)

Echte E-Mail-Anbindung (Empfang/Versand/Anhänge), Datei-Uploads, Rechnungen, echte Authentifizierung & Mandantenfähigkeit, Stundenbuchung via Zeiterfassung, Benachrichtigungen, Suche/Filter, Audit-Log.

## 9. Offene Fragen & Risiken

1. **Auth-Modell:** Nur internes Team oder echter Self-Service-Login für Kunden? Entscheidet Architektur und Datentrennung.
2. **E-Mail-System:** Microsoft 365 / Google Workspace / IMAP-SMTP? Geteiltes Postfach oder Adresse pro Vorgang? Größter Aufwands- und Risikoposten.
3. **Teilannahme von Positionen:** rechtlich/preislich heikel (Rabatte, Abhängigkeiten). Klären, ob Teilannahme erlaubt ist oder „alles oder nichts".
4. **Ablehnen fehlt:** aktuell nur Annahme oder Rückfrage – eigener Status nötig?
5. **Stage ↔ Teilaufgaben entkoppelt:** Fortschritt sollte perspektivisch aus Teilaufgaben abgeleitet werden, nicht doppelt gepflegt.
6. **Status-Übergänge & Audit:** Dropdown erlaubt beliebige Wechsel; Produktion braucht Regeln und Protokoll (wer/wann).
7. **Verantwortlich** ist Freitext; sollte gegen echte Nutzer/Teams referenzieren.
8. **Sichtbarkeit serverseitig erzwingen:** interne Daten dürfen in der Kundensicht gar nicht erst ausgeliefert werden.

## 10. Technik & Roadmap

**Vorgeschlagener Stack:** Backend Python (FastAPI) + Pydantic, DB SQLite → Postgres, Frontend React/JSX, Styling Tailwind/CSS.

- **Phase 1 (erledigt):** klickbarer Prototyp / Vision (dieser Stand).
- **Phase 2:** Backend (FastAPI + SQLite), Datenmodell laut Abschnitt 5, `api.js` von Mock auf echte Endpoints umstellen.
- **Phase 3:** E-Mail-Anbindung (Empfang, Zuordnung, Versand) als eigene Iteration.
- **Phase 4:** echte Authentifizierung, serverseitige Sichtbarkeit/Rollen, Härtung, Go-live.
