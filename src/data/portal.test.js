import { describe, it, expect } from "vitest";
import {
  suggestStage, applyAcceptOffer, applyOfferStatus,
  addMonths, calibNextDue, calibStatus, applyHistorieEntry, threadOpen,
} from "./portal.js";

describe("threadOpen", () => {
  it("offen, wenn nicht gelöst und letzte Nachricht eingehend", () => {
    expect(threadOpen({ geloest: false, nachrichten: [{ dir: "in" }] })).toBe(true);
  });
  it("nicht offen, wenn gelöst", () => {
    expect(threadOpen({ geloest: true, nachrichten: [{ dir: "in" }] })).toBe(false);
  });
  it("nicht offen, wenn letzte Nachricht ausgehend", () => {
    expect(threadOpen({ geloest: false, nachrichten: [{ dir: "in" }, { dir: "out" }] })).toBe(false);
  });
  it("nicht offen ohne Nachrichten", () => {
    expect(threadOpen({ geloest: false, nachrichten: [] })).toBe(false);
  });
});

// Minimal-Fixtures für die Angebots-/Fortschrittslogik.
const pos = (over = {}) => ({ id: "p1", betrag: "100,00 €", angenommen: false, teilaufgaben: [], ...over });
const order = (over = {}) => ({
  id: "o", stage: "angebot", angebot: { nr: "AN-1", datum: "2026-01-01", status: "offen", positionen: [pos()] },
  bestellung: null, lieferschein: null, threads: [], ...over,
});

describe("suggestStage", () => {
  it("ohne Angebot → anfrage", () => {
    expect(suggestStage(order({ angebot: null }))).toBe("anfrage");
  });
  it("Angebot offen, nicht alle angenommen → angebot", () => {
    expect(suggestStage(order())).toBe("angebot");
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

describe("applyOfferStatus", () => {
  it("setzt den Angebotsstatus", () => {
    expect(applyOfferStatus(order(), "in Klärung").angebot.status).toBe("in Klärung");
  });
});

describe("Kalibrierung", () => {
  const HEUTE = "2026-06-01";
  const geraet = (over = {}) => ({ ausgeliefert: "2025-01-01", kalibrierIntervallMonate: 12, letzteKalibrierung: "2025-03-20", ...over });

  it("addMonths rechnet Monate inkl. Jahreswechsel", () => {
    expect(addMonths("2025-03-20", 12)).toBe("2026-03-20");
    expect(addMonths("2026-01-20", 24)).toBe("2028-01-20");
  });
  it("calibNextDue: ab letzter Kalibrierung, sonst ab Auslieferung", () => {
    expect(calibNextDue(geraet())).toBe("2026-03-20");
    expect(calibNextDue(geraet({ letzteKalibrierung: null, ausgeliefert: "2026-01-20", kalibrierIntervallMonate: 24 }))).toBe("2028-01-20");
  });
  it("calibStatus: überfällig / fällig bald / kalibriert", () => {
    expect(calibStatus(geraet({ letzteKalibrierung: "2025-03-20" }), HEUTE)).toBe("überfällig"); // fällig 2026-03-20
    expect(calibStatus(geraet({ letzteKalibrierung: "2025-07-10" }), HEUTE)).toBe("fällig bald"); // fällig 2026-07-10 (39 Tage)
    expect(calibStatus(geraet({ letzteKalibrierung: null, ausgeliefert: "2026-01-20", kalibrierIntervallMonate: 24 }), HEUTE)).toBe("kalibriert");
  });

  it("applyHistorieEntry: Kalibrierung schreibt letzteKalibrierung fort, Software die Version", () => {
    const g = { letzteKalibrierung: "2025-03-20", softwareVersion: "5.28.2", historie: [] };
    const k = applyHistorieEntry(g, { datum: "2026-06-01", art: "kalibrierung", ergebnis: "in Toleranz", zertifikat: "KAL-X" });
    expect(k.letzteKalibrierung).toBe("2026-06-01");
    expect(k.historie[0].art).toBe("kalibrierung");
    const s = applyHistorieEntry(g, { datum: "2026-06-01", art: "software", version: "5.29.1" });
    expect(s.softwareVersion).toBe("5.29.1");
    expect(s.historie[0].version).toBe("5.29.1");
  });
});
