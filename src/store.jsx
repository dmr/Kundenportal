import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED, ME, today, rvUsed, applyAcceptOffer, applyRejectOffer, applyOfferStatus, applyHistorieEntry } from "./data/portal.js";

/* Zentraler Store (Prototyp). Hält DB-Daten, die aktuelle Sichtweise (persp)
   sowie alle Mutationen. Persistiert in localStorage (überlebt Reload).
   Produktion: gegen echte API tauschen. */

const StoreContext = createContext(null);
const STORAGE_KEY = "kundenportal";
// Bei Schema-/Seed-Änderungen erhöhen: alte gespeicherte Daten werden dann
// verworfen, damit neue Beispieldaten & Felder sicher erscheinen.
const STORAGE_VERSION = 4;

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => loadPersisted()?.db ?? SEED);
  // persp: null | { mode: "intern" } | { mode: "kunde", customerId }
  const [persp, setPersp] = useState(() => loadPersisted()?.persp ?? null);

  // Bei jeder Änderung sichern. Reload stellt Daten und Sichtweise wieder her.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, db, persp })); } catch { /* ignore */ }
  }, [db, persp]);

  // Demodaten zurücksetzen (Klick-Demo: Seed wiederherstellen, Sicht verlassen).
  function resetDemo() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setDb(SEED);
    setPersp(null);
  }
  // App-weiter Zustand für den "Neue Anfrage"-Dialog (Kunde).
  const [newAnfrage, setNewAnfrage] = useState(null);

  const isIntern = persp?.mode === "intern";
  const meCust = persp?.mode === "kunde" ? db.customers.find((c) => c.id === persp.customerId) : null;

  // ---- Lese-Helfer -------------------------------------------------------
  const ordersOf = (id) => db.orders.filter((o) => o.customerId === id);
  const custOf = (id) => db.customers.find((c) => c.id === id);
  const orderById = (id) => db.orders.find((o) => o.id === id);
  const geraeteOf = (id) => db.geraete.filter((g) => g.customerId === id);
  const geraetById = (id) => db.geraete.find((g) => g.id === id);
  // Sichtbare Teilaufgaben je nach Rolle (Kunde sieht nur sicht="kunde").
  const vTasks = (p) => (isIntern ? p.teilaufgaben : p.teilaufgaben.filter((t) => t.sicht === "kunde"));

  const lastIn = (arr) => arr.length > 0 && arr[arr.length - 1].dir === "in";
  function hasOpenRueckfrage(o) {
    if (o.angebot) for (const p of o.angebot.positionen) if (lastIn(p.rueckfragen)) return true;
    return lastIn(o.emails);
  }
  function latestIncoming(o) {
    const c = [];
    o.emails.forEach((m) => { if (m.dir === "in") c.push({ datum: m.datum, from: m.from, betreff: m.betreff, body: m.body }); });
    o.angebot?.positionen.forEach((p) => p.rueckfragen.forEach((m) => { if (m.dir === "in") c.push({ datum: m.datum, from: m.from, betreff: "Position: " + p.titel, body: m.text }); }));
    c.sort((a, b) => (a.datum < b.datum ? 1 : -1));
    return c[0];
  }

  const handlungsbedarf = useMemo(() => [
    ...db.orders.filter((o) => o.stage === "anfrage").map((o) => ({ k: "anfrage", o })),
    ...db.orders.filter((o) => o.stage !== "anfrage" && hasOpenRueckfrage(o)).map((o) => ({ k: "rueckfrage", o })),
  ], [db.orders]);

  // ---- Mutationen --------------------------------------------------------
  function mut(orderId, fn) { setDb((d) => ({ ...d, orders: d.orders.map((o) => (o.id === orderId ? fn(o) : o)) })); }
  function mutPos(orderId, posId, fn) {
    mut(orderId, (o) => ({ ...o, angebot: { ...o.angebot, positionen: o.angebot.positionen.map((p) => (p.id === posId ? fn(p) : p)) } }));
  }
  function addEmail(orderId, dir, from, betreff, body) {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    mut(orderId, (o) => ({ ...o, emails: [...o.emails, { dir, from, datum: stamp, betreff, body }] }));
  }
  function sendGen(orderId, draft) {
    const t = (draft || "").trim(); if (!t) return;
    const o = orderById(orderId);
    addEmail(
      orderId,
      isIntern ? "out" : "in",
      isIntern ? ME : meCust.email,
      isIntern ? "AW: " + (o.emails.at(-1)?.betreff?.replace(/^AW: /, "") || o.titel) : "Nachricht: " + o.titel,
      t,
    );
  }
  function sendPosMsg(orderId, posId, draft) {
    const t = (draft || "").trim(); if (!t) return;
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    mutPos(orderId, posId, (p) => ({ ...p, rueckfragen: [...p.rueckfragen, { dir: isIntern ? "out" : "in", from: isIntern ? ME : meCust.email, datum: stamp, text: t }] }));
  }
  // Angebotsfreigabe (alles-oder-nichts) über pure Transforms aus portal.js.
  function acceptOffer(orderId) { mut(orderId, applyAcceptOffer); }
  function rejectOffer(orderId, reason) {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    mut(orderId, (o) => applyRejectOffer(o, reason, meCust?.email || "kunde", stamp));
  }
  // Intern: Angebot erneut stellen ("offen") oder als "in Klärung" markieren.
  function setOfferStatus(orderId, status) { mut(orderId, (o) => applyOfferStatus(o, status)); }
  function setTaskStatus(orderId, posId, taskId, val) {
    mutPos(orderId, posId, (p) => ({ ...p, teilaufgaben: p.teilaufgaben.map((t) => (t.id === taskId ? { ...t, status: val } : t)) }));
  }
  function addPositionTask(orderId, posId, form) {
    if (!form?.titel?.trim()) return;
    mutPos(orderId, posId, (p) => ({ ...p, teilaufgaben: [...p.teilaufgaben, { id: "x" + Date.now(), titel: form.titel.trim(), status: "geplant", sicht: form.sicht || "kunde", verantwortlich: form.verantwortlich || "", faellig: form.faellig || "" }] }));
  }
  function setIPStatus(orderId, id, val) {
    mut(orderId, (o) => ({ ...o, internePlanung: o.internePlanung.map((t) => (t.id === id ? { ...t, status: val } : t)) }));
  }
  function setStage(orderId, key) { mut(orderId, (o) => ({ ...o, stage: key })); }
  // Kalibrierung erfassen: Historieneintrag (Scheckheft) + Fälligkeit fortschreiben.
  function addCalibration(geraetId, { datum, ergebnis }) {
    const zertifikat = "KAL-" + datum.slice(0, 4) + "-" + String(Date.now()).slice(-4);
    const entry = { datum, art: "kalibrierung", titel: "Kalibrierung", ergebnis, zertifikat };
    setDb((d) => ({ ...d, geraete: d.geraete.map((g) => (g.id === geraetId ? applyHistorieEntry(g, entry) : g)) }));
  }
  // Software-Update erfassen: explizite Version in die Historie, aktuelle Version setzen.
  function addSoftwareUpdate(geraetId, { datum, version, hinweis }) {
    const entry = { datum, art: "software", titel: "Software-Update", version, hinweis };
    setDb((d) => ({ ...d, geraete: d.geraete.map((g) => (g.id === geraetId ? applyHistorieEntry(g, entry) : g)) }));
  }
  // Legt eine neue Anfrage an und gibt deren id zurück (für Navigation).
  function createAnfrage(f) {
    if (!f?.titel?.trim() || !meCust) return null;
    const id = "n" + Date.now();
    setDb((d) => ({ ...d, orders: [
      { id, customerId: meCust.id, titel: f.titel.trim(), tlw: null, auftragsNr: null, typ: f.typ, geraetId: f.geraetId || null, stage: "anfrage", datum: today(),
        angebot: null, bestellung: null, lieferschein: null, internePlanung: [],
        emails: [{ dir: "in", from: meCust.email, datum: today() + " 00:00", betreff: "Anfrage: " + f.titel.trim(), body: f.text || "" }] },
      ...d.orders,
    ] }));
    return id;
  }

  const value = {
    db, persp, setPersp, resetDemo, isIntern, meCust, newAnfrage, setNewAnfrage,
    ordersOf, custOf, orderById, geraeteOf, geraetById, rvUsed, vTasks, lastIn, latestIncoming, handlungsbedarf,
    sendGen, sendPosMsg, acceptOffer, rejectOffer, setOfferStatus, setTaskStatus, addPositionTask, setIPStatus, setStage, addCalibration, addSoftwareUpdate, createAnfrage,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
