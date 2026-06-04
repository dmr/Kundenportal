import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx, threadOpen, PRIO_STYLE } from "../data/portal.js";
import { Status, clickable } from "../components/ui.jsx";

export default function InternHome() {
  const { db, handlungsbedarf, custOf } = useStore();
  const nav = useNavigate();
  const openOrder = (id) => nav("/auftrag/" + id);

  // Kundenübergreifend: alle Threads mit neuer (unbeantworteter) Kundenantwort.
  const antworten = db.orders
    .flatMap((o) => o.threads.filter(threadOpen).map((t) => ({ o, t, last: t.nachrichten[t.nachrichten.length - 1] })))
    .sort((a, b) => (a.last.datum < b.last.datum ? 1 : -1));

  return (
    <>
      <div className="h1 serif">Übersicht</div>
      <div className="lede">Offene Punkte über alle Kunden.</div>
      <div className="kpis">
        <div className="kpi"><div className="num">{db.orders.filter((o) => o.stage !== "abgeschlossen").length}</div><div className="k">Aktive Vorgänge</div></div>
        <div className={"kpi" + (antworten.length ? " alert" : "")}><div className="num">{antworten.length}</div><div className="k">Neue Kundenantworten</div></div>
        <div className="kpi"><div className="num">{db.orders.filter((o) => o.angebot && o.angebot.status === "offen").length}</div><div className="k">Offene Angebote</div></div>
      </div>

      <div className="sec" style={{ marginTop: 0 }}>Neue Kundenantworten <span className="note" style={{ margin: 0, fontStyle: "normal" }}>· kundenübergreifend</span></div>
      <div className="card">
        {antworten.length === 0 && <div className="empty">Keine unbeantworteten Kundenantworten.</div>}
        {antworten.map(({ o, t, last }) => {
          const ps = PRIO_STYLE[t.prioritaet] || PRIO_STYLE.normal;
          return (
            <div className="act" key={o.id + t.id} {...clickable(() => openOrder(o.id))}>
              <span className="dot" />
              <div className="grow">
                <div className="t">{t.titel} <span className="chip" style={{ background: ps.bg, color: ps.fg }}>{t.prioritaet}</span></div>
                <div className="s">{custOf(o.customerId)?.name} · {o.titel} · <span className="mono">{last.datum}</span></div>
                <div className="s" style={{ color: "var(--ink)" }}>„{last.text || (last.anhaenge?.length ? "📎 Anhang" : "")}"</div>
              </div>
              <span className="link">antworten →</span>
            </div>
          );
        })}
      </div>

      <div className="sec">Neue Anfragen</div>
      <div className="card">
        {handlungsbedarf.filter((h) => h.k === "anfrage").length === 0 && <div className="empty">Keine neuen Anfragen.</div>}
        {handlungsbedarf.filter((h) => h.k === "anfrage").map(({ o }) => (
          <div className="act" key={o.id} {...clickable(() => openOrder(o.id))}>
            <span className="dot" style={{ background: "#8A5A00" }} />
            <div className="grow">
              <div className="t">Neue Anfrage – noch kein Auftrag: {o.titel}</div>
              <div className="s">{custOf(o.customerId)?.name}</div>
            </div>
            <span className="link">öffnen →</span>
          </div>
        ))}
      </div>

      <div className="sec">Aktive Vorgänge</div>
      <div className="card">
        {db.orders.filter((o) => o.stage !== "abgeschlossen").map((o) => (
          <div className="row" key={o.id} {...clickable(() => openOrder(o.id))}>
            <span className={"tlwtag" + (o.tlw ? "" : " none")}>{o.tlw || "Anfrage"}</span>
            <div className="grow">
              <div className="name">{o.titel} {o.auftragsNr && <span className="typ">· {o.auftragsNr}</span>}</div>
              <div className="meta">{custOf(o.customerId)?.name} · {o.typ}</div>
            </div>
            <Status s={STAGES[stageIdx(o.stage)].label} />
          </div>
        ))}
      </div>
    </>
  );
}
