/* Prototyp-Daten & Konstanten.
   Produktion: SEED durch echte API-Aufrufe ersetzen; Sichtbarkeit serverseitig erzwingen. */

export const ME = "service@ihr-betrieb.de";
export const STATI = ["geplant", "läuft", "erledigt"];

export const STAGES = [
  { key: "anfrage", label: "Anfrage", kunde: "Anfrage eingegangen" },
  { key: "angebot", label: "Angebot", kunde: "Angebot erstellt" },
  { key: "auftrag", label: "Auftrag", kunde: "Auftrag bestätigt" },
  { key: "bestellung", label: "Bestellung", kunde: "Bestellt – in Vorbereitung" },
  { key: "lieferung", label: "Lieferung", kunde: "In Lieferung / Service läuft" },
  { key: "abgeschlossen", label: "Abgeschlossen", kunde: "Abgeschlossen" },
];
export const stageIdx = (k) => STAGES.findIndex((s) => s.key === k);

/* Hybrid-Fortschritt: leitet aus den vorhandenen Artefakten + Teilaufgaben eine
   *vorgeschlagene* Stage ab. Das Team kann sie übernehmen oder übersteuern. */
export function suggestStage(o) {
  if (!o.angebot) return "anfrage";
  const positionen = o.angebot.positionen || [];
  const allAccepted = positionen.length > 0 && positionen.every((p) => p.angenommen);
  if (!allAccepted) return "angebot";
  if (!o.bestellung) return "auftrag";
  if (!o.lieferschein) return "bestellung";
  const allTasksDone = positionen.every((p) => p.teilaufgaben.every((t) => t.status === "erledigt"));
  const delivered = ["zugestellt", "abgeschlossen"].includes(o.lieferschein.status);
  return allTasksDone && delivered ? "abgeschlossen" : "lieferung";
}

/* Pure Transforms für die Angebotsfreigabe (testbar, ohne React/State). */
export function applyAcceptOffer(o) {
  if (!o.angebot) return o;
  const positionen = o.angebot.positionen.map((p) => ({ ...p, angenommen: true }));
  return { ...o, angebot: { ...o.angebot, status: "angenommen", positionen }, stage: o.stage === "angebot" ? "auftrag" : o.stage };
}
// Angebotsstatus setzen ("offen" / "in Klärung").
export function applyOfferStatus(o, status) {
  if (!o.angebot) return o;
  return { ...o, angebot: { ...o.angebot, status } };
}

/* ---- Kalibrierungsmanagement -------------------------------------------- */
// Schwelle für "bald fällig" (Tage vor Fälligkeit).
export const CALIB_DUE_SOON_DAYS = 60;

export function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}
export const daysBetween = (fromStr, toStr) =>
  Math.round((Date.parse(toStr) - Date.parse(fromStr)) / 86400000);

// Nächste Fälligkeit: ab letzter Kalibrierung, sonst ab Auslieferung + Intervall.
export function calibNextDue(g) {
  const base = g.letzteKalibrierung || g.ausgeliefert;
  return addMonths(base, g.kalibrierIntervallMonate);
}
// Status relativ zu "heute": überfällig / fällig bald / kalibriert.
export function calibStatus(g, todayStr) {
  const days = daysBetween(todayStr, calibNextDue(g));
  if (days < 0) return "überfällig";
  if (days <= CALIB_DUE_SOON_DAYS) return "fällig bald";
  return "kalibriert";
}

// Labels für die Service-Historie (Scheckheft-Gefühl).
export const HISTORIE_ART = {
  auslieferung: { label: "Auslieferung", icon: "📦" },
  kalibrierung: { label: "Kalibrierung", icon: "🔧" },
  software: { label: "Software-Update", icon: "⬆️" },
  reparatur: { label: "Reparatur", icon: "🛠️" },
  wartung: { label: "Wartung", icon: "🧰" },
};

/* Pure: einen Eintrag in die Geräte-Historie aufnehmen und abhängige Felder
   fortschreiben (letzte Kalibrierung bzw. aktuelle Softwareversion). */
export function applyHistorieEntry(g, entry) {
  const historie = [entry, ...g.historie];
  const patch = {};
  if (entry.art === "kalibrierung") patch.letzteKalibrierung = entry.datum;
  if (entry.art === "software") patch.softwareVersion = entry.version;
  return { ...g, ...patch, historie };
}

export const STATUS_STYLE = {
  "offen": { bg: "#F3E7CE", fg: "#8A5A00" }, "angenommen": { bg: "#DCE7DC", fg: "#3F6B3F" },
  "in Klärung": { bg: "#DEE6F2", fg: "#1D4E89" },
  "kalibriert": { bg: "#DCE7DC", fg: "#3F6B3F" }, "fällig bald": { bg: "#F3E7CE", fg: "#8A5A00" }, "überfällig": { bg: "#F1D9D1", fg: "#A23C1E" },
  "in Toleranz": { bg: "#DCE7DC", fg: "#3F6B3F" }, "außerhalb Toleranz": { bg: "#F1D9D1", fg: "#A23C1E" },
  "bestätigt": { bg: "#DCE7DC", fg: "#3F6B3F" }, "abgeschlossen": { bg: "#DCE7DC", fg: "#3F6B3F" },
  "unterwegs": { bg: "#DEE6F2", fg: "#1D4E89" }, "zugestellt": { bg: "#DCE7DC", fg: "#3F6B3F" },
  "geplant": { bg: "#EDE6D7", fg: "#7A6F5C" }, "läuft": { bg: "#DEE6F2", fg: "#1D4E89" }, "erledigt": { bg: "#DCE7DC", fg: "#3F6B3F" },
};

export const today = () => new Date().toISOString().slice(0, 10);
export const parseEUR = (s) => parseFloat(String(s).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;
export const fmtEUR = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export const SEED = {
  customers: [
    { id: "c1", name: "IGBT Modulhersteller A", kontakt: "D. Meier", email: "einkauf@igbt-modulhersteller-a.de", ort: "Augsburg" },
    { id: "c2", name: "Thyristor Hersteller B", kontakt: "P. Schneider", email: "disposition@thyristor-hersteller-b.de", ort: "Bern" },
  ],
  orders: [
    {
      id: "o1", customerId: "c1", titel: "Auslieferung TLW 763", tlw: "TLW 763", auftragsNr: "5069", typ: "Auslieferung",
      geraetId: "g1", stage: "lieferung", datum: "2026-05-08",
      angebot: { nr: "AN-2026-0412", datum: "2026-05-10", status: "angenommen", positionen: [
        { id: "p1", titel: "Transport TLW 763 zum Zielort", betrag: "3.200,00 €", angenommen: true,
          beschreibung: "Abholung im Werk Augsburg, Lieferung zum Kundenstandort inkl. Ladungssicherung, Begleitfahrzeug und Entladung vor Ort durch geschultes Personal.",
          teilaufgaben: [
            { id: "a1", titel: "Tour disponieren & Fahrer einplanen", status: "erledigt", sicht: "intern", verantwortlich: "Disposition", faellig: "2026-05-13" },
            { id: "a2", titel: "Ladungssicherung vorbereiten", status: "erledigt", sicht: "kunde", verantwortlich: "Werkstatt", faellig: "2026-05-16" },
            { id: "a3", titel: "Anlieferung & Entladung beim Kunden", status: "läuft", sicht: "kunde", verantwortlich: "Fahrer M.", faellig: "2026-06-05" } ],
          rueckfragen: [
            { dir: "in", from: "einkauf@igbt-modulhersteller-a.de", datum: "2026-05-18 10:02", text: "Brauchen Sie für die Entladung eine Hebebühne vor Ort?" },
            { dir: "out", from: ME, datum: "2026-05-18 11:20", text: "Nein, wir bringen eine mobile Hebebühne mit." } ] },
        { id: "p2", titel: "Sonderbeschriftung", betrag: "1.620,00 €", angenommen: true,
          beschreibung: "Folierung mit Kundenlogo gemäß Designvorlage, beidseitige Anbringung, UV-beständig.",
          teilaufgaben: [
            { id: "a1", titel: "Folie nach Vorlage bestellen", status: "erledigt", sicht: "intern", verantwortlich: "Einkauf", faellig: "2026-05-15" },
            { id: "a2", titel: "Beschriftung anbringen", status: "geplant", sicht: "kunde", verantwortlich: "Werkstatt", faellig: "2026-06-02" } ],
          rueckfragen: [] } ] },
      bestellung: { nr: "BE-77123", datum: "2026-05-12", status: "bestätigt" },
      lieferschein: { nr: "LS-90011", datum: "2026-05-20", status: "unterwegs" },
      internePlanung: [
        { id: "i1", titel: "Interner Liefertermin", datum: "2026-06-03", status: "läuft", info: "2 Tage Puffer vor Kundentermin" },
        { id: "i2", titel: "Testing-Puffer", datum: "2026-06-04", status: "geplant", info: "Funktionsprüfung vor Auslieferung" } ],
      emails: [
        { dir: "in", from: "einkauf@igbt-modulhersteller-a.de", datum: "2026-05-19 09:14", betreff: "Liefertermin 5069", body: "Können Sie den Liefertermin auf KW 22 vorziehen?" },
        { dir: "out", from: ME, datum: "2026-05-19 11:02", betreff: "AW: Liefertermin 5069", body: "KW 22 ist machbar, wir bestätigen Mittwoch." } ],
    },
    {
      id: "o2", customerId: "c1", titel: "Service TLW 823", tlw: "TLW 823", auftragsNr: "5070", typ: "Service",
      stage: "angebot", datum: "2026-05-21",
      angebot: { nr: "AN-2026-0431", datum: "2026-05-21", status: "offen", positionen: [
        { id: "p1", titel: "Wartung Hydrauliksystem", betrag: "740,00 €", angenommen: false,
          beschreibung: "Komplettwartung des Hydrauliksystems inkl. Öl- und Filterwechsel, Sichtprüfung aller Leitungen und Dichtungen, Funktionsprotokoll.",
          teilaufgaben: [ { id: "a1", titel: "Ersatzteile prüfen & reservieren", status: "geplant", sicht: "intern", verantwortlich: "Werkstatt", faellig: "2026-06-02" } ],
          rueckfragen: [ { dir: "in", from: "einkauf@igbt-modulhersteller-a.de", datum: "2026-05-31 16:40", text: "Ist die Anfahrt in diesem Preis enthalten?" } ] },
        { id: "p2", titel: "Funktionsprüfung Bremsanlage", betrag: "450,00 €", angenommen: false,
          beschreibung: "Prüfung der Bremsanlage nach Herstellervorgaben inkl. Messprotokoll und Freigabevermerk.",
          teilaufgaben: [], rueckfragen: [] } ] },
      bestellung: null, lieferschein: null, internePlanung: [], emails: [],
    },
    {
      id: "o4", customerId: "c1", titel: "Zusatzlieferung Ersatzteile", tlw: null, auftragsNr: null, typ: "Auslieferung",
      stage: "anfrage", datum: "2026-05-31",
      angebot: null, bestellung: null, lieferschein: null, internePlanung: [],
      emails: [ { dir: "in", from: "einkauf@igbt-modulhersteller-a.de", datum: "2026-05-31 10:12", betreff: "Anfrage Ersatzteile", body: "Wir bräuchten kurzfristig Ersatzteile passend zu TLW 763." } ],
    },
    {
      id: "o3", customerId: "c2", titel: "Auslieferung TLW 410", tlw: "TLW 410", auftragsNr: "5031", typ: "Auslieferung",
      stage: "abgeschlossen", datum: "2026-04-12",
      angebot: { nr: "AN-2026-0388", datum: "2026-04-12", status: "angenommen", positionen: [
        { id: "p1", titel: "Auslieferung Anlage", betrag: "9.640,00 €", angenommen: true,
          beschreibung: "Transport und Inbetriebnahme der Anlage am Standort Bern inkl. Einweisung.",
          teilaufgaben: [
            { id: "a1", titel: "Transport", status: "erledigt", sicht: "kunde", verantwortlich: "Fahrer K.", faellig: "2026-04-20" },
            { id: "a2", titel: "Inbetriebnahme & Einweisung", status: "erledigt", sicht: "kunde", verantwortlich: "Technik", faellig: "2026-04-28" } ],
          rueckfragen: [] } ] },
      bestellung: { nr: "BE-76544", datum: "2026-04-15", status: "abgeschlossen" },
      lieferschein: { nr: "LS-89770", datum: "2026-04-28", status: "zugestellt" },
      internePlanung: [],
      emails: [ { dir: "in", from: "disposition@thyristor-hersteller-b.de", datum: "2026-04-29 14:20", betreff: "Empfang bestätigt", body: "Ware ist eingetroffen, vielen Dank." } ],
    },
    {
      id: "o5", customerId: "c1", titel: "Jahreswartung TLW 763", tlw: "TLW 763", auftragsNr: "5044", typ: "Service",
      geraetId: "g1", stage: "abgeschlossen", datum: "2026-03-03",
      angebot: { nr: "AN-2026-0299", datum: "2026-03-03", status: "angenommen", positionen: [
        { id: "p1", titel: "Jahreswartung & Sicherheitsprüfung", betrag: "1.180,00 €", angenommen: true,
          beschreibung: "Komplette Jahreswartung nach Herstellervorgabe inkl. Sicherheitsprüfung und Prüfprotokoll.",
          teilaufgaben: [
            { id: "a1", titel: "Wartung durchführen", status: "erledigt", sicht: "kunde", verantwortlich: "Werkstatt", faellig: "2026-03-12" },
            { id: "a2", titel: "Prüfprotokoll übergeben", status: "erledigt", sicht: "kunde", verantwortlich: "Technik", faellig: "2026-03-14" } ],
          rueckfragen: [] } ] },
      bestellung: { nr: "BE-76401", datum: "2026-03-05", status: "abgeschlossen" },
      lieferschein: { nr: "LS-89610", datum: "2026-03-14", status: "zugestellt" },
      internePlanung: [],
      emails: [ { dir: "in", from: "einkauf@igbt-modulhersteller-a.de", datum: "2026-03-15 08:30", betreff: "Wartung erledigt", body: "Alles bestens, danke für die schnelle Abwicklung." } ],
    },
    {
      id: "o6", customerId: "c1", titel: "Anbauteile TLW 763", tlw: "TLW 763", auftragsNr: "5018", typ: "Service",
      geraetId: "g1", stage: "abgeschlossen", datum: "2026-02-09",
      angebot: { nr: "AN-2026-0188", datum: "2026-02-09", status: "angenommen", positionen: [
        { id: "p1", titel: "Lieferung & Montage Anbauteile", betrag: "2.460,00 €", angenommen: true,
          beschreibung: "Lieferung der Anbauteile inkl. Montage und Funktionsprüfung vor Ort.",
          teilaufgaben: [
            { id: "a1", titel: "Teile liefern", status: "erledigt", sicht: "kunde", verantwortlich: "Fahrer K.", faellig: "2026-02-18" },
            { id: "a2", titel: "Montage & Abnahme", status: "erledigt", sicht: "kunde", verantwortlich: "Werkstatt", faellig: "2026-02-20" } ],
          rueckfragen: [] } ] },
      bestellung: { nr: "BE-76220", datum: "2026-02-11", status: "abgeschlossen" },
      lieferschein: { nr: "LS-89412", datum: "2026-02-20", status: "zugestellt" },
      internePlanung: [],
      emails: [],
    },
    {
      id: "o7", customerId: "c2", titel: "Kalibrierung TLW 813", tlw: "TLW 813", auftragsNr: "4998", typ: "Kalibrierung",
      geraetId: "g4", stage: "abgeschlossen", datum: "2025-02-05",
      angebot: { nr: "AN-2025-0240", datum: "2025-02-05", status: "angenommen", positionen: [
        { id: "p1", titel: "Kalibrierung & Justage TLW 813", betrag: "420,00 €", angenommen: true,
          beschreibung: "Kalibrierung des Lastwechsel-Testsystems nach Herstellervorgabe inkl. Justage und Ausstellung des Kalibrierzertifikats.",
          teilaufgaben: [
            { id: "a1", titel: "Kalibrierung durchführen", status: "erledigt", sicht: "kunde", verantwortlich: "Kalibrierlabor", faellig: "2025-02-15" },
            { id: "a2", titel: "Zertifikat ausstellen", status: "erledigt", sicht: "kunde", verantwortlich: "Kalibrierlabor", faellig: "2025-02-16" } ],
          rueckfragen: [] } ] },
      bestellung: { nr: "BE-75810", datum: "2025-02-07", status: "abgeschlossen" },
      lieferschein: { nr: "LS-88905", datum: "2025-02-16", status: "zugestellt" },
      internePlanung: [],
      emails: [],
    },
    {
      id: "o8", customerId: "c1", titel: "Kalibrierung TLW 763", tlw: "TLW 763", auftragsNr: null, typ: "Kalibrierung",
      geraetId: "g1", stage: "anfrage", datum: "2026-05-28",
      angebot: null, bestellung: null, lieferschein: null, internePlanung: [],
      emails: [ { dir: "in", from: "einkauf@igbt-modulhersteller-a.de", datum: "2026-05-28 09:40", betreff: "Kalibrierung fällig TLW 763", body: "Unser Lastwechsel-Testsystem TLW 763 ist überfällig — bitte Kalibrierung einplanen." } ],
    },
  ],
  geraete: [
    { id: "g1", customerId: "c1", bezeichnung: "TLW 763", hersteller: "Schuster Elektronik", typ: "Lastwechsel-Testsystem für Halbleitermodule", seriennummer: "TLW763-2207", bild: "products/tlw763.jpg",
      ausgeliefert: "2024-03-15", kalibrierIntervallMonate: 12, letzteKalibrierung: "2025-03-20", softwareVersion: "5.29.1",
      historie: [
        { datum: "2025-03-20", art: "software", titel: "Software-Update", version: "5.29.1", hinweis: "Messwertspeicher erweitert" },
        { datum: "2025-03-20", art: "kalibrierung", titel: "Jahreskalibrierung", ergebnis: "in Toleranz", zertifikat: "KAL-2025-1182" },
        { datum: "2024-09-10", art: "software", titel: "Software-Update", version: "5.28.2", hinweis: "Fehlerbehebung Bluetooth" },
        { datum: "2024-03-15", art: "auslieferung", titel: "Gerät ausgeliefert", version: "5.27.4" },
      ] },
    { id: "g2", customerId: "c1", bezeichnung: "TLW 800", hersteller: "Schuster Elektronik", typ: "Lastwechsel-Testsystem für Halbleitermodule", seriennummer: "TLW800-2419", bild: "products/tlw800.jpg",
      ausgeliefert: "2025-07-01", kalibrierIntervallMonate: 12, letzteKalibrierung: "2025-07-10", softwareVersion: "5.29.1",
      historie: [
        { datum: "2026-01-15", art: "software", titel: "Software-Update", version: "5.29.1", hinweis: "Sicherheitsupdate" },
        { datum: "2025-07-10", art: "kalibrierung", titel: "Erstkalibrierung", ergebnis: "in Toleranz", zertifikat: "KAL-2025-1450" },
        { datum: "2025-07-01", art: "auslieferung", titel: "Gerät ausgeliefert", version: "5.28.2" },
      ] },
    { id: "g3", customerId: "c1", bezeichnung: "TLW 739", hersteller: "Schuster Elektronik", typ: "Lastwechsel-Testsystem für Halbleitermodule", seriennummer: "TLW739-1933", bild: "products/tlw739.jpg",
      ausgeliefert: "2026-01-20", kalibrierIntervallMonate: 24, letzteKalibrierung: null, softwareVersion: "5.29.0",
      historie: [
        { datum: "2026-01-20", art: "auslieferung", titel: "Gerät ausgeliefert", version: "5.29.0" },
      ] },
    { id: "g4", customerId: "c2", bezeichnung: "TLW 813", hersteller: "Schuster Elektronik", typ: "Lastwechsel-Testsystem für Halbleiter", seriennummer: "TLW813-3120", bild: "products/tlw813.jpg",
      ausgeliefert: "2025-02-10", kalibrierIntervallMonate: 12, letzteKalibrierung: "2025-02-15", softwareVersion: "5.28.2",
      historie: [
        { datum: "2025-11-20", art: "software", titel: "Software-Update", version: "5.28.2", hinweis: "Genauigkeit Neigungssensor verbessert" },
        { datum: "2025-08-05", art: "reparatur", titel: "Reparatur", beschreibung: "Display getauscht, Libelle neu justiert." },
        { datum: "2025-02-15", art: "kalibrierung", titel: "Erstkalibrierung", ergebnis: "in Toleranz", zertifikat: "KAL-2025-0210" },
        { datum: "2025-02-10", art: "auslieferung", titel: "Gerät ausgeliefert", version: "5.27.4" },
      ] },
  ],
};
