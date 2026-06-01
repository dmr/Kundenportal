import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx } from "../data/portal.js";
import { Status, clickable } from "../components/ui.jsx";

export default function CustomerDetail() {
  const { custId } = useParams();
  const { custOf, ordersOf } = useStore();
  const nav = useNavigate();
  const cust = custOf(custId);

  if (!cust) return <Navigate to="/intern/kunden" replace />;

  return (
    <>
      <div className="h1 serif">{cust.name}</div>
      <div className="lede">{cust.kontakt} · {cust.ort}</div>
      <div className="card">
        {ordersOf(cust.id).map((o) => (
          <div className="row" key={o.id} {...clickable(() => nav("/auftrag/" + o.id))}>
            <span className={"tlwtag" + (o.tlw ? "" : " none")}>{o.tlw || "Anfrage"}</span>
            <div className="grow">
              <div className="name">{o.titel}</div>
              <div className="meta">{o.typ}{o.auftragsNr ? " · " + o.auftragsNr : ""}</div>
            </div>
            <Status s={STAGES[stageIdx(o.stage)].label} />
          </div>
        ))}
      </div>
    </>
  );
}
