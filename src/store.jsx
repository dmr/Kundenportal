import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED, ME, today, applyAcceptOffer, applyOfferStatus, applyHistorieEntry, threadOpen, matchThreadForMail, stripSubject, customerByEmail } from "./data/portal.js";

/* Zentraler Store (Prototyp). Hält DB-Daten, die aktuelle Sichtweise (persp)
   sowie alle Mutationen. Persistiert in localStorage (überlebt Reload).
   Produktion: gegen echte API tauschen. */

const StoreContext = createContext(null);
const STORAGE_KEY = "kundenportal";
// Bei Schema-/Seed-Änderungen erhöhen: alte gespeicherte Daten werden dann
// verworfen, damit neue Beispieldaten & Felder sicher erscheinen.
const STORAGE_VERSION = 11;

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
  const ordersForGeraet = (gid) => db.orders.filter((o) => o.geraetId === gid);
  // Sichtbare Teilaufgaben je nach Rolle (Kunde sieht nur sicht="kunde").
  const vTasks = (p) => (isIntern ? p.teilaufgaben : p.teilaufgaben.filter((t) => t.sicht === "kunde"));

  // Aktion nötig, sobald irgendein Thread des Vorgangs offen ist.
  function hasOpenRueckfrage(o) { return o.threads.some(threadOpen); }
  function latestIncoming(o) {
    const c = [];
    o.threads.forEach((th) => th.nachrichten.forEach((m) => { if (m.dir === "in") c.push({ datum: m.datum, from: m.from, betreff: th.titel, body: m.text }); }));
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
  // ---- Threads -----------------------------------------------------------
  function setThread(orderId, threadId, fn) {
    mut(orderId, (o) => ({ ...o, threads: o.threads.map((t) => (t.id === threadId ? fn(t) : t)) }));
  }
  function newMessage(text, anhaenge) {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    return { dir: isIntern ? "out" : "in", from: isIntern ? ME : meCust.email, datum: stamp, text, anhaenge: anhaenge || [] };
  }
  // Nachricht senden – öffnet den Thread automatisch wieder.
  function sendThreadMsg(orderId, threadId, text, anhaenge) {
    const t = (text || "").trim();
    if (!t && !(anhaenge && anhaenge.length)) return;
    setThread(orderId, threadId, (th) => ({ ...th, geloest: false, nachrichten: [...th.nachrichten, newMessage(t, anhaenge)] }));
  }
  // Neuen (benannten) Thread anlegen, optional an eine Position gebunden.
  function createThread(orderId, { titel, prioritaet, positionId }, text, anhaenge) {
    const id = "th" + Date.now();
    const msg = newMessage((text || "").trim(), anhaenge);
    const nachrichten = msg.text || msg.anhaenge.length ? [msg] : [];
    mut(orderId, (o) => ({ ...o, threads: [...o.threads, { id, titel: titel?.trim() || "Thema", prioritaet: prioritaet || "normal", positionId: positionId || null, geloest: false, nachrichten }] }));
    return id;
  }
  function setThreadResolved(orderId, threadId, val) { setThread(orderId, threadId, (t) => ({ ...t, geloest: val, geloestAm: val ? today() : null })); }
  function setThreadPriority(orderId, threadId, val) { setThread(orderId, threadId, (t) => ({ ...t, prioritaet: val })); }
  function setThreadTitle(orderId, threadId, titel) {
    const tt = (titel || "").trim(); if (!tt) return;
    setThread(orderId, threadId, (t) => ({ ...t, titel: tt }));
  }

  // ---- Geteiltes Postfach (service@) -------------------------------------
  const custByEmail = (from) => customerByEmail(db.customers, from);
  function mailToMessage(m) { return { dir: "in", from: m.from, datum: m.datum, text: m.body, anhaenge: m.anhaenge || [] }; }
  // Eingehende Mail: passt der Betreff zu einem Thread → als Antwort einsortieren,
  // sonst landet sie unzugeordnet im Postfach.
  function addIncomingMail({ from, betreff, body, anhaenge }) {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const m = { id: "m" + Date.now(), from: from || "extern@unbekannt", betreff: betreff || "(kein Betreff)", body: body || "", datum: stamp, anhaenge: anhaenge || [] };
    const match = matchThreadForMail(db.orders, m);
    if (match) {
      setThread(match.orderId, match.threadId, (t) => ({ ...t, geloest: false, geloestAm: null, nachrichten: [...t.nachrichten, mailToMessage(m)] }));
      return { matched: true, orderId: match.orderId };
    }
    setDb((d) => ({ ...d, maileingang: [m, ...(d.maileingang || [])] }));
    return { matched: false };
  }
  // Unzugeordnete Mail an einen bestehenden Thread anhängen (öffnet ihn wieder).
  function appendMailToThread(mailId, orderId, threadId) {
    const m = (db.maileingang || []).find((x) => x.id === mailId);
    if (!m || !orderId || !threadId) return;
    setDb((d) => ({ ...d,
      maileingang: d.maileingang.filter((x) => x.id !== mailId),
      orders: d.orders.map((o) => (o.id !== orderId ? o : { ...o, threads: o.threads.map((t) => (t.id !== threadId ? t : { ...t, geloest: false, geloestAm: null, nachrichten: [...t.nachrichten, mailToMessage(m)] })) })),
    }));
  }
  // Unzugeordnete Mail einem bestehenden Auftrag als neuer Thread zuordnen.
  function assignMailToOrder(mailId, orderId) {
    const m = (db.maileingang || []).find((x) => x.id === mailId);
    if (!m || !orderId) return;
    setDb((d) => ({ ...d,
      maileingang: d.maileingang.filter((x) => x.id !== mailId),
      orders: d.orders.map((o) => (o.id !== orderId ? o : { ...o, threads: [...o.threads, { id: "th" + Date.now(), titel: stripSubject(m.betreff) || "E-Mail", prioritaet: "normal", positionId: null, geloest: false, nachrichten: [mailToMessage(m)] }] })),
    }));
  }
  // Unzugeordnete Mail zu einem neuen Auftrag (Anfrage) machen; gibt die id zurück.
  function assignMailToNewOrder(mailId, customerId) {
    const m = (db.maileingang || []).find((x) => x.id === mailId);
    if (!m || !customerId) return null;
    const id = "n" + Date.now();
    setDb((d) => ({ ...d,
      maileingang: d.maileingang.filter((x) => x.id !== mailId),
      orders: [{ id, customerId, titel: stripSubject(m.betreff) || "Neue Anfrage", tlw: null, auftragsNr: null, typ: "Sonstiges", geraetId: null, stage: "anfrage", datum: today(),
        angebot: null, bestellung: null, lieferschein: null, internePlanung: [],
        threads: [{ id: "th" + Date.now(), titel: stripSubject(m.betreff) || "Anfrage", prioritaet: "normal", positionId: null, geloest: false, nachrichten: [mailToMessage(m)] }] }, ...d.orders],
    }));
    return id;
  }
  // Angebotsfreigabe (alles-oder-nichts) über pure Transform aus portal.js.
  function acceptOffer(orderId) { mut(orderId, applyAcceptOffer); }
  // Angebotsstatus setzen ("offen" / "in Klärung").
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
        threads: [{ id: "th" + Date.now(), titel: "Anfrage", prioritaet: "normal", positionId: null, geloest: false,
          nachrichten: [{ dir: "in", from: meCust.email, datum: today() + " 00:00", text: f.text?.trim() || ("Neue Anfrage: " + f.titel.trim()), anhaenge: [] }] }] },
      ...d.orders,
    ] }));
    return id;
  }

  const value = {
    db, persp, setPersp, resetDemo, isIntern, meCust, newAnfrage, setNewAnfrage,
    ordersOf, custOf, orderById, geraeteOf, geraetById, ordersForGeraet, vTasks, latestIncoming, handlungsbedarf,
    custByEmail, addIncomingMail, appendMailToThread, assignMailToOrder, assignMailToNewOrder,
    sendThreadMsg, createThread, setThreadResolved, setThreadPriority, setThreadTitle, acceptOffer, setOfferStatus, setTaskStatus, addPositionTask, setIPStatus, setStage, addCalibration, addSoftwareUpdate, createAnfrage,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
