import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx, fmtH } from "../data/portal.js";
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
  const { meCust, rvUsed, ordersOf } = useStore();
  const nav = useNavigate();
  const orders = meCust ? ordersOf(meCust.id) : [];
  const aktiv = orders.filter((o) => o.stage !== "abgeschlossen");
  const fertig = orders.filter((o) => o.stage === "abgeschlossen");

  return (
    <>
      <div className="h1 serif">Ihre Aufträge</div>
      <div className="lede">Status auf einen Blick — inklusive Anfragen ohne Auftrag.</div>

      {meCust?.rahmenvertrag && (() => {
        const rv = meCust.rahmenvertrag, used = rvUsed(meCust), rem = rv.budgetStunden - used;
        return (
          <div className="rv">
            <div className="top">
              <div className="sec" style={{ margin: 0 }}>Service-Rahmenvertrag {rv.nr}</div>
              <div className="rem">{fmtH(rem)} <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 400 }}>verfügbar</span></div>
            </div>
            <div className="bar"><div className="fill" style={{ width: (used / rv.budgetStunden * 100) + "%" }} /></div>
            <div className="scale"><span>{fmtH(used)} genutzt</span><span>Budget {fmtH(rv.budgetStunden)}</span></div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>Für kurzfristige Detailerweiterungen ohne neues Angebot.</div>
          </div>
        );
      })()}

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
