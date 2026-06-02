import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx } from "../data/portal.js";
import { Status, clickable } from "../components/ui.jsx";

/* Globale Suche über Aufträge, Themen und Geräte – rollen-scoped, Begriff in der URL (?q=). */
export default function Suche() {
  const { isIntern, db, meCust, ordersOf, geraeteOf, custOf } = useStore();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const ql = q.toLowerCase();

  const orders = isIntern ? db.orders : (meCust ? ordersOf(meCust.id) : []);
  const geraete = isIntern ? db.geraete : (meCust ? geraeteOf(meCust.id) : []);
  const has = (s) => String(s || "").toLowerCase().includes(ql);

  const oHits = ql ? orders.filter((o) => [o.titel, o.tlw, o.auftragsNr, o.typ].some(has)) : [];
  const tHits = ql ? orders.flatMap((o) => o.threads.filter((t) => has(t.titel) || t.nachrichten.some((m) => has(m.text))).map((t) => ({ o, t }))) : [];
  const gHits = ql ? geraete.filter((g) => [g.bezeichnung, g.seriennummer, g.hersteller, g.typ].some(has)) : [];
  const total = oHits.length + tHits.length + gHits.length;

  return (
    <>
      <div className="h1 serif">Suche</div>
      <div className="lede">{q ? total + " Treffer für „" + q + "”" : "Suchbegriff oben in der Leiste eingeben."}</div>

      {q && oHits.length > 0 && (<>
        <div className="sec" style={{ marginTop: 0 }}>Aufträge</div>
        <div className="card">{oHits.map((o) => (
          <div className="row" key={o.id} {...clickable(() => nav("/auftrag/" + o.id))}>
            <span className={"tlwtag" + (o.tlw ? "" : " none")}>{o.tlw || "Anfrage"}</span>
            <div className="grow"><div className="name">{o.titel}</div><div className="meta">{custOf(o.customerId)?.name} · {o.typ}</div></div>
            <Status s={STAGES[stageIdx(o.stage)].label} />
          </div>
        ))}</div>
      </>)}

      {q && tHits.length > 0 && (<>
        <div className="sec">Themen</div>
        <div className="card">{tHits.map(({ o, t }) => (
          <div className="row" key={o.id + t.id} {...clickable(() => nav("/auftrag/" + o.id))}>
            <div className="grow"><div className="name">{t.titel}</div><div className="meta">{o.titel} · {custOf(o.customerId)?.name}</div></div>
            <span className="chev">›</span>
          </div>
        ))}</div>
      </>)}

      {q && gHits.length > 0 && (<>
        <div className="sec">Geräte</div>
        <div className="card">{gHits.map((g) => (
          <div className="row" key={g.id} {...clickable(() => nav(isIntern ? "/intern/kalibrierung" : "/kunde/geraete"))}>
            <div className="grow"><div className="name">{g.bezeichnung}</div><div className="meta">{g.hersteller} · SN {g.seriennummer}</div></div>
            <span className="chev">›</span>
          </div>
        ))}</div>
      </>)}

      {q && total === 0 && <div className="card"><div className="empty">Keine Treffer.</div></div>}
    </>
  );
}
