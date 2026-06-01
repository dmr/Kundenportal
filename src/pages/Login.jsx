import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";

export default function Login() {
  const { db, setPersp, resetDemo } = useStore();
  const nav = useNavigate();
  const [showIntern, setShowIntern] = useState(false);

  const pickKunde = (c) => { setPersp({ mode: "kunde", customerId: c.id }); nav("/kunde"); };
  const pickIntern = () => { setPersp({ mode: "intern" }); nav("/intern"); };

  return (
    <div className="tlw-root">
      <div className="login">
        <div className="mark serif">Ihr Auftragsportal</div>
        <div className="sub">Anmelden · Pseudo-Login</div>

        <div className="grp">
          {db.customers.map((c) => (
            <button key={c.id} className="pick kunde" onClick={() => pickKunde(c)}>
              <div className="role">Kundenzugang</div>
              <div className="nm">{c.name}</div>
              <div className="d">Aufträge verfolgen, Angebote freigeben, Rückfragen stellen.</div>
            </button>
          ))}
        </div>

        {/* Interne Ansicht bewusst sekundär (Self-Service-Portal = Kunde zuerst). */}
        {showIntern ? (
          <button className="pick intern" style={{ marginTop: 22, width: 280 }} onClick={pickIntern}>
            <div className="role">Team</div>
            <div className="nm">Interne Ansicht</div>
            <div className="d">Alle Vorgänge, Positionen & Teilaufgaben, interne Planung bearbeiten.</div>
          </button>
        ) : (
          <button className="linkbtn" style={{ marginTop: 24 }} onClick={() => setShowIntern(true)}>
            Mitarbeiter:in? → Interne Ansicht öffnen
          </button>
        )}

        <button className="linkbtn muted" style={{ marginTop: 18 }} onClick={resetDemo}>↺ Demodaten zurücksetzen</button>
      </div>
    </div>
  );
}
