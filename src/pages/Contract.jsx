import { Navigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { fmtH } from "../data/portal.js";

export default function Contract() {
  const { meCust, rvUsed } = useStore();
  if (!meCust?.rahmenvertrag) return <Navigate to="/kunde" replace />;

  const rv = meCust.rahmenvertrag, used = rvUsed(meCust), rem = rv.budgetStunden - used;
  return (
    <>
      <div className="h1 serif">Service-Rahmenvertrag</div>
      <div className="lede">{rv.nr} · Budget für kurzfristige Detailerweiterungen ohne neues Angebot.</div>
      <div className="rv">
        <div className="top">
          <div className="sec" style={{ margin: 0 }}>Verfügbares Budget</div>
          <div className="rem">{fmtH(rem)}</div>
        </div>
        <div className="bar"><div className="fill" style={{ width: (used / rv.budgetStunden * 100) + "%" }} /></div>
        <div className="scale"><span>{fmtH(used)} genutzt</span><span>von {fmtH(rv.budgetStunden)}</span></div>
      </div>
      <div className="sec">Eingesetzte Detailerweiterungen</div>
      <div className="card">
        <table>
          <thead><tr><th>Leistung</th><th>Datum</th><th style={{ textAlign: "right" }}>Aufwand</th></tr></thead>
          <tbody>
            {rv.eintraege.map((e, i) => (
              <tr key={i}><td>{e.titel}</td><td className="mono">{e.datum}</td><td className="mono" style={{ textAlign: "right" }}>{fmtH(e.stunden)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
