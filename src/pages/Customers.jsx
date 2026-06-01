import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { clickable } from "../components/ui.jsx";

export default function Customers() {
  const { db, ordersOf } = useStore();
  const nav = useNavigate();

  return (
    <>
      <div className="h1 serif">Kunden</div>
      <div className="lede">Kunde wählen für dessen Vorgänge.</div>
      <div className="card">
        {db.customers.map((c) => (
          <div className="row" key={c.id} {...clickable(() => nav("/intern/kunden/" + c.id))}>
            <div className="grow">
              <div className="name">{c.name}</div>
              <div className="meta">{c.kontakt} · {c.ort}</div>
            </div>
            <span className="count">{ordersOf(c.id).length} Vorgänge</span>
          </div>
        ))}
      </div>
    </>
  );
}
