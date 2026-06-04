import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store.jsx";
import { threadOpen, PRIO_RANK, PRIO_STYLE } from "../data/portal.js";

const COLS = [
  { key: "thema", label: "Thema" },
  { key: "kunde", label: "Kunde" },
  { key: "prio", label: "Priorität" },
  { key: "erstellt", label: "Erstellt" },
  { key: "antworten", label: "Antworten", right: true },
  { key: "anhaenge", label: "Anhänge", right: true },
  { key: "status", label: "Status" },
  { key: "geloestAm", label: "Erledigt am" },
];

// Triage einer unzugeordneten E-Mail: Kunde + Auftrag + (optional) Thread wählen,
// an bestehenden Thread anhängen / als neuen Thread zuordnen / neuen Auftrag anlegen.
function MailTriage({ mail, customers, ordersOf, custByEmail, onAppend, onAssign, onNew }) {
  const matched = custByEmail(mail.from);
  const [cust, setCust] = useState(matched?.id || customers[0]?.id || "");
  const orders = ordersOf(cust);
  const [order, setOrder] = useState(orders[0]?.id || "");
  const [thread, setThread] = useState("");
  const threads = orders.find((o) => o.id === order)?.threads || [];
  const onCust = (id) => { setCust(id); const os = ordersOf(id); setOrder(os[0]?.id || ""); setThread(""); };
  const onOrder = (id) => { setOrder(id); setThread(""); };
  const zuordnen = () => { if (!order) return; thread ? onAppend(mail.id, order, thread) : onAssign(mail.id, order); };

  return (
    <div className="mailcard">
      <div className="mailhead"><span className="mono small">✉ {mail.from}</span><span className="mono small">{mail.datum}</span></div>
      <div className="mailsubj">{mail.betreff}</div>
      <div className="mailbody">{mail.body}</div>
      <div className="mailactions">
        <select value={cust} onChange={(e) => onCust(e.target.value)} aria-label="Kunde">{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={order} onChange={(e) => onOrder(e.target.value)} disabled={!orders.length} aria-label="Auftrag">
          {orders.length ? orders.map((o) => <option key={o.id} value={o.id}>{o.titel}</option>) : <option value="">— kein Auftrag —</option>}
        </select>
        <select value={thread} onChange={(e) => setThread(e.target.value)} disabled={!order} aria-label="Thread">
          <option value="">— neuer Thread —</option>
          {threads.map((t) => <option key={t.id} value={t.id}>{t.titel}</option>)}
        </select>
        <button className="btn sm" disabled={!order} onClick={zuordnen}>Zuordnen</button>
        <button className="btn ghost sm" onClick={() => onNew(mail.id, cust)}>Neuer Auftrag</button>
      </div>
    </div>
  );
}

export default function Inbox() {
  const { db, custOf, ordersOf, custByEmail, addIncomingMail, appendMailToThread, assignMailToOrder, assignMailToNewOrder } = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [sim, setSim] = useState(null); // { from, betreff, body }
  const [simResult, setSimResult] = useState("");

  // ---- Filter & Sortierung leben in der URL (teil-/bookmarkbar) -----------
  const fStatus = params.get("status") || "alle";
  const fPrio = params.get("prio") || "alle";
  const fKunde = params.get("kunde") || "alle";
  const sortKey = params.get("sort") || "prio";
  const sortDir = params.get("dir") || "asc";

  const setParam = (patch) => setParams((prev) => {
    const n = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => { if (!v || v === "alle") n.delete(k); else n.set(k, v); });
    return n;
  }, { replace: true });

  const clickHeader = (key) => setParam(sortKey === key ? { sort: key, dir: sortDir === "asc" ? "desc" : "asc" } : { sort: key, dir: "asc" });
  const arrow = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const mails = db.maileingang || [];

  let rows = [];
  db.orders.forEach((o) => o.threads.forEach((t) => {
    rows.push({
      o, t, thema: t.titel, vorgang: o.titel,
      kunde: custOf(o.customerId)?.name || "",
      prio: t.prioritaet, prioRank: PRIO_RANK[t.prioritaet] ?? 1,
      erstellt: t.nachrichten[0]?.datum || "",
      antworten: t.nachrichten.length,
      anhaenge: t.nachrichten.reduce((s, m) => s + (m.anhaenge?.length || 0), 0),
      offen: threadOpen(t), geloest: !!t.geloest, geloestAm: t.geloestAm || "",
    });
  }));

  rows = rows.filter((r) =>
    (fStatus === "alle" || (fStatus === "offen" ? !r.geloest : r.geloest)) &&
    (fPrio === "alle" || r.prio === fPrio) &&
    (fKunde === "alle" || r.o.customerId === fKunde));

  const val = (r, key) => ({
    thema: r.thema.toLowerCase(), kunde: r.kunde.toLowerCase(), prio: r.prioRank,
    erstellt: r.erstellt, antworten: r.antworten, anhaenge: r.anhaenge,
    status: r.geloest ? 1 : 0, geloestAm: r.geloestAm,
  }[key]);
  rows.sort((a, b) => {
    const va = val(a, sortKey), vb = val(b, sortKey);
    let c = va < vb ? -1 : va > vb ? 1 : 0;
    c = sortDir === "asc" ? c : -c;
    if (c !== 0) return c;
    if (a.offen !== b.offen) return a.offen ? -1 : 1;
    return a.erstellt < b.erstellt ? 1 : a.erstellt > b.erstellt ? -1 : 0;
  });

  const submitSim = () => {
    const res = addIncomingMail(sim || {});
    setSimResult(res.matched ? "✓ Automatisch einem Thread als Antwort zugeordnet." : "→ Nicht zugeordnet — im Postfach zur Zuordnung.");
    setSim(null);
  };
  const onNew = (mailId, custId) => { const id = assignMailToNewOrder(mailId, custId); if (id) nav("/auftrag/" + id); };

  const filtersActive = fStatus !== "alle" || fPrio !== "alle" || fKunde !== "alle";

  return (
    <>
      <div className="h1 serif">Posteingang</div>
      <div className="lede">Geteiltes Postfach service@ und alle Themen über alle Kunden.</div>

      {/* Geteiltes Postfach: unzugeordnete eingehende E-Mails */}
      <div className="sec" style={{ marginTop: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Maileingang (service@) · {mails.length} nicht zugeordnet</span>
        {!sim && <button className="btn ghost sm" onClick={() => { setSim({ from: "", betreff: "", body: "" }); setSimResult(""); }}>Eingehende Mail simulieren</button>}
      </div>
      {sim && (
        <div className="frm" style={{ marginBottom: 14 }}>
          <div className="rowf">
            <input placeholder="Absender (z. B. einkauf@igbt-modulhersteller-a.de)" value={sim.from} onChange={(e) => setSim({ ...sim, from: e.target.value })} />
            <input placeholder="Betreff (z. B. AW: Liefertermin 5069)" value={sim.betreff} onChange={(e) => setSim({ ...sim, betreff: e.target.value })} />
          </div>
          <textarea placeholder="Nachricht …" style={{ minHeight: 60 }} value={sim.body} onChange={(e) => setSim({ ...sim, body: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm" onClick={submitSim}>Mail empfangen</button>
            <button className="btn ghost sm" onClick={() => setSim(null)}>Abbrechen</button>
          </div>
          <div className="note" style={{ fontStyle: "normal" }}>Enthält der Betreff einen Thread-Titel (z. B. „Liefertermin 5069"), wird die Mail automatisch als Antwort einsortiert — sonst landet sie unten zur Zuordnung.</div>
        </div>
      )}
      {simResult && <div className="muted small" style={{ marginBottom: 12 }}>{simResult}</div>}
      {mails.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {mails.map((m) => (
            <MailTriage key={m.id} mail={m} customers={db.customers} ordersOf={ordersOf} custByEmail={custByEmail}
              onAppend={(id, ordId, thId) => { appendMailToThread(id, ordId, thId); nav("/auftrag/" + ordId); }}
              onAssign={(id, ordId) => { assignMailToOrder(id, ordId); nav("/auftrag/" + ordId); }}
              onNew={onNew} />
          ))}
        </div>
      )}

      {/* Filterleiste (Status/Priorität/Kunde) – Auswahl steht in der URL */}
      <div className="sec">Themen</div>
      <div className="filterbar">
        <div className="seg">
          {["alle", "offen", "erledigt"].map((s) => (
            <button key={s} className={fStatus === s ? "on" : ""} onClick={() => setParam({ status: s })}>{s === "alle" ? "Alle" : s === "offen" ? "Offen" : "Erledigt"}</button>
          ))}
        </div>
        <select value={fPrio} onChange={(e) => setParam({ prio: e.target.value })}>
          <option value="alle">Priorität: alle</option>
          <option value="hoch">hoch</option><option value="normal">normal</option><option value="niedrig">niedrig</option>
        </select>
        <select value={fKunde} onChange={(e) => setParam({ kunde: e.target.value })}>
          <option value="alle">Kunde: alle</option>
          {db.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {filtersActive && <button className="linkbtn" onClick={() => setParam({ status: "", prio: "", kunde: "" })}>Filter zurücksetzen</button>}
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {rows.length === 0 ? (
          <div className="empty">Keine Themen für diese Filter.</div>
        ) : (
          <table className="sortable">
            <thead>
              <tr>{COLS.map((c) => (
                <th key={c.key} style={c.right ? { textAlign: "right" } : null} aria-sort={sortKey === c.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button className="th-sort" onClick={() => clickHeader(c.key)}>{c.label}{arrow(c.key)}</button>
                </th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const ps = PRIO_STYLE[r.prio] || PRIO_STYLE.normal;
                return (
                  <tr key={r.o.id + r.t.id} className="clickrow" onClick={() => nav("/auftrag/" + r.o.id)}>
                    <td><button className="rowlink" onClick={(e) => { e.stopPropagation(); nav("/auftrag/" + r.o.id); }}>{r.offen && <span className="reddot" />}{r.thema}</button><div className="meta">{r.vorgang}</div></td>
                    <td>{r.kunde}</td>
                    <td><span className="chip" style={{ background: ps.bg, color: ps.fg }}>{r.prio}</span></td>
                    <td className="mono small">{r.erstellt || "—"}</td>
                    <td style={{ textAlign: "right" }}>{r.antworten}</td>
                    <td style={{ textAlign: "right" }}>{r.anhaenge > 0 ? "📎 " + r.anhaenge : "—"}</td>
                    <td>{r.geloest
                      ? <span className="chip" style={{ background: "#DCE7DC", color: "#3F6B3F" }}>erledigt</span>
                      : <span className="chip" style={{ background: r.offen ? "#F3E7CE" : "#EDE6D7", color: r.offen ? "#8A5A00" : "#7A6F5C" }}>{r.offen ? "offen" : "wartet"}</span>}
                    </td>
                    <td className="mono small">{r.geloestAm || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
