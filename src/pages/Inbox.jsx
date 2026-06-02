import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function Inbox() {
  const { db, custOf } = useStore();
  const nav = useNavigate();
  const [sort, setSort] = useState({ key: "prio", dir: "asc" });

  const rows = [];
  db.orders.forEach((o) => o.threads.forEach((t) => {
    rows.push({
      o, t,
      thema: t.titel,
      vorgang: o.titel,
      kunde: custOf(o.customerId)?.name || "",
      prio: t.prioritaet,
      prioRank: PRIO_RANK[t.prioritaet] ?? 1,
      erstellt: t.nachrichten[0]?.datum || "",
      antworten: t.nachrichten.length,
      anhaenge: t.nachrichten.reduce((s, m) => s + (m.anhaenge?.length || 0), 0),
      offen: threadOpen(t),
      geloest: !!t.geloest,
      geloestAm: t.geloestAm || "",
    });
  }));

  const val = (r, key) => ({
    thema: r.thema.toLowerCase(), kunde: r.kunde.toLowerCase(), prio: r.prioRank,
    erstellt: r.erstellt, antworten: r.antworten, anhaenge: r.anhaenge,
    status: r.geloest ? 1 : 0, geloestAm: r.geloestAm,
  }[key]);

  const sorted = rows.sort((a, b) => {
    const va = val(a, sort.key), vb = val(b, sort.key);
    let c = va < vb ? -1 : va > vb ? 1 : 0;
    c = sort.dir === "asc" ? c : -c;
    if (c !== 0) return c;
    // Tiebreak: offene zuerst, dann neueste.
    if (a.offen !== b.offen) return a.offen ? -1 : 1;
    return a.erstellt < b.erstellt ? 1 : a.erstellt > b.erstellt ? -1 : 0;
  });

  const clickHeader = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const arrow = (key) => (sort.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "");

  const offenCount = rows.filter((r) => r.offen).length;

  return (
    <>
      <div className="h1 serif">Posteingang</div>
      <div className="lede">Alle Themen über alle Kunden · {offenCount} offen. Spalten zum Sortieren anklicken.</div>

      <div className="card" style={{ overflowX: "auto" }}>
        {rows.length === 0 ? (
          <div className="empty">Keine Themen.</div>
        ) : (
          <table className="sortable">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c.key} className="sortth" style={c.right ? { textAlign: "right" } : null} onClick={() => clickHeader(c.key)}>
                    {c.label}{arrow(c.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const ps = PRIO_STYLE[r.prio] || PRIO_STYLE.normal;
                return (
                  <tr key={r.o.id + r.t.id} className="clickrow" onClick={() => nav("/auftrag/" + r.o.id)}>
                    <td>
                      <div className="name" style={{ fontSize: 14 }}>{r.offen && <span className="reddot" />}{r.thema}</div>
                      <div className="meta">{r.vorgang}</div>
                    </td>
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
