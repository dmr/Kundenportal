import { describe, it, expect } from "vitest";
import { suggestStage, rvUsed, applyAcceptOffer, applyRejectOffer, applyOfferStatus } from "./portal.js";

// Minimal-Fixtures für die Angebots-/Fortschrittslogik.
const pos = (over = {}) => ({ id: "p1", betrag: "100,00 €", angenommen: false, teilaufgaben: [], rueckfragen: [], ...over });
const order = (over = {}) => ({
  id: "o", stage: "angebot", angebot: { nr: "AN-1", datum: "2026-01-01", status: "offen", positionen: [pos()] },
  bestellung: null, lieferschein: null, emails: [], ...over,
});

describe("suggestStage", () => {
  it("ohne Angebot → anfrage", () => {
    expect(suggestStage(order({ angebot: null }))).toBe("anfrage");
  });
  it("Angebot offen, nicht alle angenommen → angebot", () => {
    expect(suggestStage(order())).toBe("angebot");
  });
  it("abgelehntes Angebot → angebot", () => {
    expect(suggestStage(order({ angebot: { status: "abgelehnt", positionen: [pos({ angenommen: true })] } }))).toBe("angebot");
  });
  it("alle angenommen, keine Bestellung → auftrag", () => {
    expect(suggestStage(order({ angebot: { status: "angenommen", positionen: [pos({ angenommen: true })] } }))).toBe("auftrag");
  });
  it("Bestellung vorhanden, kein Lieferschein → bestellung", () => {
    expect(suggestStage(order({
      angebot: { status: "angenommen", positionen: [pos({ angenommen: true })] },
      bestellung: { nr: "BE-1" },
    }))).toBe("bestellung");
  });
  it("Lieferschein unterwegs / Aufgaben offen → lieferung", () => {
    expect(suggestStage(order({
      angebot: { status: "angenommen", positionen: [pos({ angenommen: true, teilaufgaben: [{ status: "läuft" }] })] },
      bestellung: { nr: "BE-1" }, lieferschein: { nr: "LS-1", status: "unterwegs" },
    }))).toBe("lieferung");
  });
  it("Lieferschein zugestellt + alle Aufgaben erledigt → abgeschlossen", () => {
    expect(suggestStage(order({
      angebot: { status: "angenommen", positionen: [pos({ angenommen: true, teilaufgaben: [{ status: "erledigt" }] })] },
      bestellung: { nr: "BE-1" }, lieferschein: { nr: "LS-1", status: "zugestellt" },
    }))).toBe("abgeschlossen");
  });
});

describe("rvUsed", () => {
  it("summiert die Einträge", () => {
    expect(rvUsed({ rahmenvertrag: { eintraege: [{ stunden: 2 }, { stunden: 1.5 }] } })).toBe(3.5);
  });
  it("ohne Rahmenvertrag → 0", () => {
    expect(rvUsed({ rahmenvertrag: null })).toBe(0);
    expect(rvUsed(undefined)).toBe(0);
  });
});

describe("applyAcceptOffer", () => {
  it("setzt alle Positionen angenommen, Status angenommen, Stage angebot→auftrag", () => {
    const o = applyAcceptOffer(order({ angebot: { status: "offen", positionen: [pos(), pos({ id: "p2" })] } }));
    expect(o.angebot.status).toBe("angenommen");
    expect(o.angebot.positionen.every((p) => p.angenommen)).toBe(true);
    expect(o.stage).toBe("auftrag");
  });
  it("lässt eine spätere Stage unverändert", () => {
    const o = applyAcceptOffer(order({ stage: "lieferung" }));
    expect(o.stage).toBe("lieferung");
  });
});

describe("applyRejectOffer", () => {
  it("setzt Status abgelehnt und fügt mit Grund eine eingehende Nachricht hinzu", () => {
    const o = applyRejectOffer(order(), "Zu teuer", "kunde@x.de", "2026-01-02 10:00");
    expect(o.angebot.status).toBe("abgelehnt");
    expect(o.emails).toHaveLength(1);
    expect(o.emails[0]).toMatchObject({ dir: "in", from: "kunde@x.de", body: "Zu teuer" });
  });
  it("ohne Grund keine zusätzliche Nachricht", () => {
    const o = applyRejectOffer(order(), "  ", "kunde@x.de", "2026-01-02 10:00");
    expect(o.angebot.status).toBe("abgelehnt");
    expect(o.emails).toHaveLength(0);
  });
});

describe("applyOfferStatus", () => {
  it("setzt den Angebotsstatus", () => {
    expect(applyOfferStatus(order(), "in Klärung").angebot.status).toBe("in Klärung");
  });
});
