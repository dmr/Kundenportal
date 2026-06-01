import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";

export default function Login() {
  const { db, setPersp } = useStore();
  const nav = useNavigate();

  const pickIntern = () => { setPersp({ mode: "intern" }); nav("/intern"); };
  const pickKunde = (c) => { setPersp({ mode: "kunde", customerId: c.id }); nav("/kunde"); };

  return (
    <div className="tlw-root">
      <div className="login">
        <div className="mark serif">Auftragsportal</div>
        <div className="sub">Sichtweise wählen · Pseudo-Login</div>
        <div className="grp">
          <button className="pick intern" onClick={pickIntern}>
            <div className="role">Team</div>
            <div className="nm">Intern</div>
            <div className="d">Alle Vorgänge, Positionen mit Teilaufgaben, interne Planung, bearbeiten.</div>
          </button>
          {db.customers.map((c) => (
            <button key={c.id} className="pick kunde" onClick={() => pickKunde(c)}>
              <div className="role">Kundensicht</div>
              <div className="nm">{c.name}</div>
              <div className="d">Fortschritt, Positionen annehmen, Rückfragen stellen, Rahmenvertrag.</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
