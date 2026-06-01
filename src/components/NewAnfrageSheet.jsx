import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";

// Kundensicht: eine Anfrage ist nie eine "Auslieferung" – sie startet mit dem,
// was der Kunde will (Kalibrierung, Service/Reparatur, Sonstiges).
const ANFRAGE_TYPEN = ["Kalibrierung", "Service / Reparatur", "Sonstiges"];

export default function NewAnfrageSheet() {
  const { newAnfrage, setNewAnfrage, createAnfrage, meCust, geraeteOf } = useStore();
  const nav = useNavigate();
  if (!newAnfrage) return null;

  const geraete = meCust ? geraeteOf(meCust.id) : [];
  const isKalib = newAnfrage.typ === "Kalibrierung";

  const submit = () => {
    const id = createAnfrage(newAnfrage);
    if (!id) return;
    setNewAnfrage(null);
    nav("/auftrag/" + id);
  };

  // Bei Kalibrierung den Titel aus dem gewählten Gerät vorbelegen, falls leer.
  const pickGeraet = (gid) => {
    const g = geraete.find((x) => x.id === gid);
    setNewAnfrage({ ...newAnfrage, geraetId: gid || null, titel: newAnfrage.titel || (g ? "Kalibrierung " + g.bezeichnung : "") });
  };

  return (
    <div className="overlay" onClick={() => setNewAnfrage(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top"><strong>Neue Anfrage stellen</strong><button className="x" onClick={() => setNewAnfrage(null)}>×</button></div>
        <div className="sheet-body"><div className="frm" style={{ border: "none", padding: 0, background: "none" }}>
          <label className="flabel">Worum geht es?</label>
          <select value={newAnfrage.typ} onChange={(e) => setNewAnfrage({ ...newAnfrage, typ: e.target.value, geraetId: e.target.value === "Kalibrierung" ? newAnfrage.geraetId : null })}>
            {ANFRAGE_TYPEN.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {isKalib && geraete.length > 0 && (
            <>
              <label className="flabel">Gerät</label>
              <select value={newAnfrage.geraetId || ""} onChange={(e) => pickGeraet(e.target.value)}>
                <option value="">— Gerät wählen —</option>
                {geraete.map((g) => <option key={g.id} value={g.id}>{g.bezeichnung} · {g.seriennummer}</option>)}
              </select>
            </>
          )}

          <label className="flabel">Titel</label>
          <input placeholder={isKalib ? "z. B. Kalibrierung Drehmomentschlüssel" : "Kurzbeschreibung"} value={newAnfrage.titel} onChange={(e) => setNewAnfrage({ ...newAnfrage, titel: e.target.value })} />

          <label className="flabel">Beschreibung</label>
          <textarea placeholder="Details (optional)" style={{ minHeight: 80 }} value={newAnfrage.text} onChange={(e) => setNewAnfrage({ ...newAnfrage, text: e.target.value })} />

          <button className="btn" onClick={submit}>Anfrage absenden</button>
          <div className="note">Wird ohne Auftrag angelegt. Wir prüfen und erstellen daraus ein Angebot.</div>
        </div></div>
      </div>
    </div>
  );
}
