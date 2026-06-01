import { useState } from "react";
import { useStore } from "../store.jsx";
import { calibStatus, calibNextDue, today } from "../data/portal.js";
import { Status } from "./ui.jsx";

/* Gerätedetail als Sheet: Stammdaten, Kalibrierstatus & -historie (Zertifikate).
   Intern: Kalibrierung erfassen. Kunde: Kalibrierung anfragen. */
export default function DeviceSheet({ geraet: g, onClose }) {
  const { isIntern, addCalibration, setNewAnfrage } = useStore();
  const [form, setForm] = useState(null); // { datum, ergebnis }
  const td = today();
  const status = calibStatus(g, td);
  const due = calibNextDue(g);

  const save = () => {
    if (!form?.datum) return;
    addCalibration(g.id, form);
    setForm(null);
  };
  const requestCalib = () => {
    setNewAnfrage({ titel: "Kalibrierung " + g.bezeichnung, typ: "Kalibrierung", text: "", geraetId: g.id });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top"><strong>{g.bezeichnung}</strong><button className="x" onClick={onClose}>×</button></div>
        <div className="sheet-body">
          <div className="muted small">{g.hersteller} · {g.typ} · SN <span className="mono">{g.seriennummer}</span></div>

          <div className="devgrid">
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Kalibrierstatus</div><Status s={status} /></div>
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Nächste Fälligkeit</div><div className="mono">{due}</div></div>
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Intervall</div><div>{g.kalibrierIntervallMonate} Monate</div></div>
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Ausgeliefert</div><div className="mono">{g.ausgeliefert}</div></div>
          </div>

          {!isIntern && (
            <button className="btn" style={{ marginTop: 16 }} onClick={requestCalib}>Kalibrierung anfragen</button>
          )}

          {isIntern && (form ? (
            <div className="frm" style={{ marginTop: 16 }}>
              <div className="subh" style={{ margin: 0 }}>Kalibrierung erfassen</div>
              <div className="rowf">
                <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} />
                <select value={form.ergebnis} onChange={(e) => setForm({ ...form, ergebnis: e.target.value })}>
                  <option value="in Toleranz">in Toleranz</option>
                  <option value="außerhalb Toleranz">außerhalb Toleranz</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn sm" onClick={save}>Speichern</button>
                <button className="btn ghost sm" onClick={() => setForm(null)}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <button className="btn" style={{ marginTop: 16 }} onClick={() => setForm({ datum: td, ergebnis: "in Toleranz" })}>+ Kalibrierung erfassen</button>
          ))}

          <div className="subh">Kalibrierhistorie</div>
          {g.zertifikate.length === 0 && <div className="muted small">Noch keine Kalibrierung erfasst.</div>}
          {g.zertifikate.map((z) => (
            <div className="taskcard" key={z.nr}><div className="tcrow">
              <div className="grow">
                <div className="tcname">Zertifikat <span className="mono">{z.nr}</span></div>
                <div className="tcmeta">kalibriert {z.datum} · gültig bis {z.gueltigBis}</div>
              </div>
              <Status s={z.ergebnis} />
            </div></div>
          ))}
          <div className="note" style={{ fontStyle: "normal" }}>Zertifikat-Download im Prototyp nicht hinterlegt.</div>
        </div>
      </div>
    </div>
  );
}
