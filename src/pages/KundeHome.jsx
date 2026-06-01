import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx, fmtH } from "../data/portal.js";

export default function KundeHome() {
  const { meCust, rvUsed, ordersOf } = useStore();
  const nav = useNavigate();
  const orders = meCust ? ordersOf(meCust.id) : [];

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

      <div className="card">
        {orders.map((o) => {
          const ci = stageIdx(o.stage);
          return (
            <div className="row" key={o.id} onClick={() => nav("/auftrag/" + o.id)}>
              <span className={"tlwtag" + (o.tlw ? "" : " none")}>{o.tlw || "Anfrage"}</span>
              <div className="grow">
                <div className="name">{o.titel}</div>
                <div className="meta">{o.typ}{o.auftragsNr ? " · Auftrag " + o.auftragsNr : " · noch kein Auftrag"}</div>
              </div>
              <span className="chip" style={{ background: o.stage === "abgeschlossen" ? "#DCE7DC" : "var(--accent-soft)", color: o.stage === "abgeschlossen" ? "#3F6B3F" : "var(--accent)" }}>
                Schritt {ci + 1}/6 · {STAGES[ci].label}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
