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

export const STATUS_STYLE = {
  "offen": { bg: "#F3E7CE", fg: "#8A5A00" }, "angenommen": { bg: "#DCE7DC", fg: "#3F6B3F" },
  "bestätigt": { bg: "#DCE7DC", fg: "#3F6B3F" }, "abgeschlossen": { bg: "#DCE7DC", fg: "#3F6B3F" },
  "unterwegs": { bg: "#DEE6F2", fg: "#1D4E89" }, "zugestellt": { bg: "#DCE7DC", fg: "#3F6B3F" },
  "geplant": { bg: "#EDE6D7", fg: "#7A6F5C" }, "läuft": { bg: "#DEE6F2", fg: "#1D4E89" }, "erledigt": { bg: "#DCE7DC", fg: "#3F6B3F" },
};

export const fmtH = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",") + " h";
export const today = () => new Date().toISOString().slice(0, 10);
export const parseEUR = (s) => parseFloat(String(s).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;
export const fmtEUR = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export const SEED = {
  customers: [
    { id: "c1", name: "Meier Logistik GmbH", kontakt: "D. Meier", email: "einkauf@meier-logistik.de", ort: "Augsburg",
      rahmenvertrag: { nr: "RV-2026-014", budgetStunden: 20, eintraege: [
        { titel: "Zusätzliche Halterung montiert", stunden: 2, datum: "2026-05-14" },
        { titel: "Kurzfristige Terminverschiebung organisiert", stunden: 1.5, datum: "2026-05-19" },
        { titel: "Sonderbeschriftung TLW 763", stunden: 3, datum: "2026-05-22" } ] } },
    { id: "c2", name: "Schneider Bau AG", kontakt: "P. Schneider", email: "disposition@schneider-bau.ch", ort: "Bern", rahmenvertrag: null },
  ],
  orders: [
    {
      id: "o1", customerId: "c1", titel: "Auslieferung TLW 763", tlw: "TLW 763", auftragsNr: "5069", typ: "Auslieferung",
      stage: "lieferung", datum: "2026-05-08",
      angebot: { nr: "AN-2026-0412", datum: "2026-05-10", status: "angenommen", positionen: [
        { id: "p1", titel: "Transport TLW 763 zum Zielort", betrag: "3.200,00 €", angenommen: true,
          beschreibung: "Abholung im Werk Augsburg, Lieferung zum Kundenstandort inkl. Ladungssicherung, Begleitfahrzeug und Entladung vor Ort durch geschultes Personal.",
          teilaufgaben: [
            { id: "a1", titel: "Tour disponieren & Fahrer einplanen", status: "erledigt", sicht: "intern", verantwortlich: "Disposition", faellig: "2026-05-13" },
            { id: "a2", titel: "Ladungssicherung vorbereiten", status: "erledigt", sicht: "kunde", verantwortlich: "Werkstatt", faellig: "2026-05-16" },
            { id: "a3", titel: "Anlieferung & Entladung beim Kunden", status: "läuft", sicht: "kunde", verantwortlich: "Fahrer M.", faellig: "2026-06-05" } ],
          rueckfragen: [
            { dir: "in", from: "einkauf@meier-logistik.de", datum: "2026-05-18 10:02", text: "Brauchen Sie für die Entladung eine Hebebühne vor Ort?" },
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
        { dir: "in", from: "einkauf@meier-logistik.de", datum: "2026-05-19 09:14", betreff: "Liefertermin 5069", body: "Können Sie den Liefertermin auf KW 22 vorziehen?" },
        { dir: "out", from: ME, datum: "2026-05-19 11:02", betreff: "AW: Liefertermin 5069", body: "KW 22 ist machbar, wir bestätigen Mittwoch." } ],
    },
    {
      id: "o2", customerId: "c1", titel: "Service TLW 823", tlw: "TLW 823", auftragsNr: "5070", typ: "Service",
      stage: "angebot", datum: "2026-05-21",
      angebot: { nr: "AN-2026-0431", datum: "2026-05-21", status: "offen", positionen: [
        { id: "p1", titel: "Wartung Hydrauliksystem", betrag: "740,00 €", angenommen: false,
          beschreibung: "Komplettwartung des Hydrauliksystems inkl. Öl- und Filterwechsel, Sichtprüfung aller Leitungen und Dichtungen, Funktionsprotokoll.",
          teilaufgaben: [ { id: "a1", titel: "Ersatzteile prüfen & reservieren", status: "geplant", sicht: "intern", verantwortlich: "Werkstatt", faellig: "2026-06-02" } ],
          rueckfragen: [ { dir: "in", from: "einkauf@meier-logistik.de", datum: "2026-05-31 16:40", text: "Ist die Anfahrt in diesem Preis enthalten?" } ] },
        { id: "p2", titel: "Funktionsprüfung Bremsanlage", betrag: "450,00 €", angenommen: false,
          beschreibung: "Prüfung der Bremsanlage nach Herstellervorgaben inkl. Messprotokoll und Freigabevermerk.",
          teilaufgaben: [], rueckfragen: [] } ] },
      bestellung: null, lieferschein: null, internePlanung: [], emails: [],
    },
    {
      id: "o4", customerId: "c1", titel: "Zusatzlieferung Ersatzteile", tlw: null, auftragsNr: null, typ: "Auslieferung",
      stage: "anfrage", datum: "2026-05-31",
      angebot: null, bestellung: null, lieferschein: null, internePlanung: [],
      emails: [ { dir: "in", from: "einkauf@meier-logistik.de", datum: "2026-05-31 10:12", betreff: "Anfrage Ersatzteile", body: "Wir bräuchten kurzfristig Ersatzteile passend zu TLW 763." } ],
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
      emails: [ { dir: "in", from: "disposition@schneider-bau.ch", datum: "2026-04-29 14:20", betreff: "Empfang bestätigt", body: "Ware ist eingetroffen, vielen Dank." } ],
    },
  ],
};
