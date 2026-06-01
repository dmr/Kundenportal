import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";

/* Dialog "Neue Anfrage" (Kundensicht). Wird über den App-weiten Store-State
   newAnfrage gesteuert, damit ihn die Navigation aus dem Layout öffnen kann. */
export default function NewAnfrageSheet() {
  const { newAnfrage, setNewAnfrage, createAnfrage } = useStore();
  const nav = useNavigate();
  if (!newAnfrage) return null;

  const submit = () => {
    const id = createAnfrage(newAnfrage);
    if (!id) return;
    setNewAnfrage(null);
    nav("/auftrag/" + id);
  };

  return (
    <div className="overlay" onClick={() => setNewAnfrage(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top"><strong>Neue Anfrage stellen</strong><button className="x" onClick={() => setNewAnfrage(null)}>×</button></div>
        <div className="sheet-body"><div className="frm" style={{ border: "none", padding: 0, background: "none" }}>
          <input placeholder="Worum geht es?" value={newAnfrage.titel} onChange={(e) => setNewAnfrage({ ...newAnfrage, titel: e.target.value })} />
          <select value={newAnfrage.typ} onChange={(e) => setNewAnfrage({ ...newAnfrage, typ: e.target.value })}>
            <option>Auslieferung</option><option>Service</option>
          </select>
          <textarea placeholder="Beschreibung" style={{ minHeight: 90 }} value={newAnfrage.text} onChange={(e) => setNewAnfrage({ ...newAnfrage, text: e.target.value })} />
          <button className="btn" onClick={submit}>Anfrage absenden</button>
          <div className="note">Wird ohne Auftrag angelegt. Wir erstellen daraus ein Angebot mit Positionen.</div>
        </div></div>
      </div>
    </div>
  );
}
