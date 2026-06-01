import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx } from "../data/portal.js";
import { clickable } from "../components/ui.jsx";

function OrderRow({ o, onClick, done }) {
  const ci = stageIdx(o.stage);
  return (
    <div className="row" {...clickable(onClick)}>
      <span className={"tlwtag" + (o.tlw ? "" : " none")}>{o.tlw || "Anfrage"}</span>
      <div className="grow">
        <div className="name">{o.titel}</div>
        {/* Status/Inhalt führt — Klartext statt Code, kein Preis. */}
        <div className="meta">{STAGES[ci].kunde}</div>
      </div>
      <span className="chip" style={{ background: done ? "#DCE7DC" : "var(--accent-soft)", color: done ? "#3F6B3F" : "var(--accent)" }}>
        {done ? "Abgeschlossen" : "Schritt " + (ci + 1) + "/6"}
      </span>
    </div>
  );
}

export default function KundeHome() {
  const { meCust, ordersOf } = useStore();
  const nav = useNavigate();
  const orders = meCust ? ordersOf(meCust.id) : [];
  const aktiv = orders.filter((o) => o.stage !== "abgeschlossen");
  const fertig = orders.filter((o) => o.stage === "abgeschlossen");

  return (
    <>
      <div className="h1 serif">Ihre Aufträge</div>
      <div className="lede">Status auf einen Blick — inklusive Anfragen ohne Auftrag.</div>

      <div className="sec" style={{ marginTop: 4 }}>Aktive Aufträge</div>
      <div className="card">
        {aktiv.length === 0 && <div className="empty">Aktuell keine aktiven Aufträge.</div>}
        {aktiv.map((o) => <OrderRow key={o.id} o={o} onClick={() => nav("/auftrag/" + o.id)} />)}
      </div>

      {fertig.length > 0 && (
        <>
          <div className="sec">Abgeschlossen</div>
          <div className="card done-group">
            {fertig.map((o) => <OrderRow key={o.id} o={o} done onClick={() => nav("/auftrag/" + o.id)} />)}
          </div>
        </>
      )}
    </>
  );
}
