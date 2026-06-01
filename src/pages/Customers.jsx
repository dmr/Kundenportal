import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";

export default function Customers() {
  const { db, ordersOf } = useStore();
  const nav = useNavigate();

  return (
    <>
      <div className="h1 serif">Kunden</div>
      <div className="lede">Kunde wählen für dessen Vorgänge.</div>
      <div className="card">
        {db.customers.map((c) => (
          <div className="row" key={c.id} onClick={() => nav("/intern/kunden/" + c.id)}>
            <div className="grow">
              <div className="name">{c.name}</div>
              <div className="meta">{c.kontakt} · {c.ort} · {c.rahmenvertrag ? "Rahmenvertrag " + c.rahmenvertrag.nr : "kein Rahmenvertrag"}</div>
            </div>
            <span className="count">{ordersOf(c.id).length} Vorgänge</span>
          </div>
        ))}
      </div>
    </>
  );
}
