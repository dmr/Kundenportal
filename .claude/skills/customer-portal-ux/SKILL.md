---
name: customer-portal-ux
description: >-
  UX-Leitlinien für B2B-Kunden-/Auftragsportale — Status/Fortschritt (Stepper),
  Angebots-Freigabe (annehmen/ablehnen/Rückfrage), Self-Service-Design und dezente
  Preisdarstellung. Recherchebasiert (NN/G, Baymard, Polaris u. a.). Verwenden, wenn
  am Kundenportal Status-Anzeigen, Angebots-/Freigabe-Flows, Navigation, leere Zustände
  oder die Darstellung von Preisen vs. Status entworfen oder überarbeitet werden.
---

# Customer-Portal-UX — Entwurfsleitlinien

Recherchierte, zitierte Prinzipien für B2B-Kunden-/Auftragsportale. Bei UX-Entscheidungen
in diesem Repo zuerst hier nachsehen, dann anwenden. Quellen am Ende.

## Leitgedanke (Kunde-zuerst)

Status, Umfang und die **nächste Aktion** stehen oben. Interne Felder und Preisdetails sind
nachgelagert oder ausklappbar (Progressive Disclosure). Self-Service-Kern ohne Support:
Vorgang ansehen · neue Anfrage einreichen · Angebot freigeben · Rückfrage stellen.

## 1. Status & Fortschritt (Stepper)

- **Alle Stufen von Beginn an sichtbar** — gibt Überblick und baut ein mentales Modell auf. [NN/G Progress Indicators]
- **Drei klar unterscheidbare Zustände** pro Schritt: erledigt / aktuell / ausstehend. Keine rigiden, unbeschrifteten Indikatoren. [UXPin]
- **Klartext statt Backend-Jargon** ("In Lieferung", nicht "fulfilled"); Schritte benennen + nummerieren. [NN/G Status Trackers G3]
- **Aktuellsten Status priorisieren**, datierte Historie darunter; auf Mobile vertikal. [NN/G Status Trackers G2/G10]
- **Leere/frühe Zustände explizit beschriften**: "Noch kein Angebot — wir prüfen Ihre Anfrage" statt grauer Leerstufe. Auch bei wenig Bewegung beruhigende Updates geben. [NN/G Status Trackers G9]
- **Aktive vs. abgeschlossene Vorgänge trennen** (eigene Gruppe/Ansicht). [UXPin]
- **Datenqualität sichern** — Status muss akkurat/automatisiert sein, sonst Vertrauensverlust. [NN/G G11]

## 2. Angebots-Freigabe (Quote Approval)

- **Drei klare Aktionen: Annehmen / Ablehnen / Rückfrage.** [Estimate Rocket, Zoho]
- **Alles-oder-nichts** ist juristisch sauber: Annahme muss das Angebot exakt spiegeln; jede Änderung ist ein Gegenangebot, keine Annahme. Kernumfang nicht in Teilannahmen aufbrechen. [Sirion]
- **Optionale Zusatzposten** — falls Teilwahl nötig — explizit als optionale Line-Items kennzeichnen, nicht den Kernumfang splitten. [Ququ, Adobe Commerce]
- **Verhandeln als geführter Pfad** (Betrag + Notiz → Status "in Klärung"), kein Freitext-Chaos. [Adobe Commerce]
- **Bestätigung/Signatur im Portal**, Flow von Prüfung bis verbindlicher Zusage in einem Schritt. [SuiteFiles, Estimate Rocket]
- **Status nach Aktion automatisch zurückspielen** — kein manueller Zwischenschritt. [Zoho]

## 3. Self-Service-Design

- **Kernfunktionen self-service** (ansehen, anfragen, freigeben, Beleg sehen) — deflektiert Routine-Tickets. [Vezert, k-eCommerce]
- **Progressive Disclosure**: Wichtigstes above the fold, Komplexes erst auf Anforderung. [NN/G Progressive Disclosure]
- **Eindeutige Action-Buttons + konsistente UX-Copy.** [Vezert]
- **Kommunikation an den Vorgang binden** (Rückfragen/Notizen am Angebot/Auftrag, nicht in losen Kanälen). [Estimate Rocket]
- **Rollen/Sichtbarkeit**: Tracking aus dem Konto erreichbar; interne Daten serverseitig fernhalten. [NN/G G1, k-eCommerce]
- **Omnichannel-Konsistenz**: Portal, Support, Benachrichtigungen zeigen identischen Status. [NN/G G12]

## 4. Preise dezent

- **Inhalt/Status vor Geldbetrag** — solange kein verbindlicher Auftrag besteht, ist der Preis nachgelagert. [NN/G Progressive Disclosure, Baymard]
- **Subdued-Stil für Beträge**: gedämpfte Farbe, tabellarische Ziffern, kein Blickfang. [Shopify Polaris]
- **Preise konditional offenlegen** (Aufklappen/Detail). [NN/G, UXPin]
- **Prominenz dem Verbindlichkeitsgrad anpassen**: erst im Freigabe-Screen (Angebot → Auftrag) darf der Gesamtbetrag prominent zur Entscheidung treten. [Estimate Rocket, Polaris]

## Anwendung in diesem Repo

- **6-stufiger Stepper** (Anfrage → Angebot → Auftrag → Bestellung → Lieferung → Abgeschlossen): alle Stufen sichtbar, abgeschlossener Vorgang = letzter Punkt erledigt (nicht "aktuell"). Leere Stufen mit Klartext-Status.
- **Kundenstartseite**: aktive Vorgänge zuerst, abgeschlossene als eigene, ruhigere Gruppe. Zeilen führen mit Status/Inhalt, nicht mit Preis oder TLW-Code.
- **Auftragsdetail (Kunde)**: Reihenfolge = Status → nächste Aktion → Inhalt. Bei offenem Angebot eine prominente Freigabe-Box mit Annehmen/Ablehnen/Rückfrage; **nur hier** der Gesamtbetrag prominent. Positionspreise sonst subdued.
- **Hybrid-Fortschritt**: Stage aus Artefakten/Teilaufgaben ableiten (`suggestStage`), Team kann übersteuern.

## Quellen

- NN/G — Status Trackers & Progress Updates: https://www.nngroup.com/articles/status-tracker-progress-update/
- NN/G — Progress Indicators: https://www.nngroup.com/articles/progress-indicators/
- NN/G — Progressive Disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- Baymard — Order Tracking UX: https://baymard.com/blog/integrate-tracking-info
- UXPin — Progress Tracker Design: https://www.uxpin.com/studio/blog/design-progress-trackers/
- Shopify Polaris — Typography: https://polaris.shopify.com/design/typography/using-type
- Shopify Polaris — Localized Currency: https://polaris-react.shopify.com/foundations/formatting-localized-currency
- Estimate Rocket — Online Acceptance & Signature: https://support.estimaterocket.com/estimating-and-invoicing/proposals-change-orders-online-acceptance-and-signature-capture
- Zoho Invoice — Accepting Quotes: https://www.zoho.com/invoice/help/estimate/estimate-accept.html
- Adobe Commerce — Negotiate a Quote (B2B): https://experienceleague.adobe.com/en/docs/commerce-admin/b2b/quotes/quote-price-negotiation
- SuiteFiles — Document Approval Workflow: https://www.suitefiles.com/document-approval-workflow-software/
- Sirion — Acceptance in Contract Law: https://www.sirion.ai/library/contract-management/acceptance-in-contract-law/
- Ququ — Optional Line Items in Quotes: https://blog.ququ.design/optional-line-items-in-quotes-how-to-offer-add-ons-without-making-the-client-think-twice
- Vezert — SaaS Customer Portal Design: https://vezert.com/blog/saas-customer-portal-design-best-practices
- k-eCommerce — B2B Customer Portal Best Practices: https://k-ecommerce.com/blog/b2b-ecommerce-customer-portal-best-practices
