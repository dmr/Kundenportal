import { useState } from "react";
import { useStore } from "../store.jsx";
import { calibStatus, calibNextDue, today, HISTORIE_ART } from "../data/portal.js";
import { Status } from "./ui.jsx";

// Detail eines Historieneintrags je nach Art (Scheckheft-Gefühl).
function EintragDetail({ e }) {
  if (e.art === "kalibrierung")
    return <>Ergebnis <Status s={e.ergebnis} /> · Zertifikat <span className="mono">{e.zertifikat}</span></>;
  if (e.art === "software")
    return <>Version <span className="mono ver">{e.version}</span>{e.hinweis ? " · " + e.hinweis : ""}</>;
  if (e.art === "reparatur") return <>{e.beschreibung}</>;
  if (e.art === "auslieferung") return <>{e.version ? <>ausgeliefert mit Software <span className="mono ver">{e.version}</span></> : "Gerät ausgeliefert"}</>;
  return null;
}

/* Gerätedetail als Sheet: Stammdaten, Kalibrierstatus & Service-Historie (wie ein
   Auto-Scheckheft). Intern: Kalibrierung/Software-Update erfassen. Kunde: anfragen. */
export default function DeviceSheet({ geraet: g, onClose }) {
  const { isIntern, addCalibration, addSoftwareUpdate, setNewAnfrage } = useStore();
  const [form, setForm] = useState(null); // { mode, datum, ergebnis?, version?, hinweis? }
  const td = today();
  const status = calibStatus(g, td);
  const due = calibNextDue(g);
  const historie = [...g.historie].sort((a, b) => (a.datum < b.datum ? 1 : -1));

  const save = () => {
    if (!form?.datum) return;
    if (form.mode === "kalib") addCalibration(g.id, { datum: form.datum, ergebnis: form.ergebnis });
    else { if (!form.version?.trim()) return; addSoftwareUpdate(g.id, { datum: form.datum, version: form.version.trim(), hinweis: form.hinweis?.trim() || "" }); }
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
          {g.bild && <img className="devimg" src={import.meta.env.BASE_URL + g.bild} alt={g.bezeichnung} loading="lazy" />}
          <div className="muted small">{g.hersteller} · {g.typ} · SN <span className="mono">{g.seriennummer}</span></div>

          <div className="devgrid">
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Kalibrierstatus</div><Status s={status} /></div>
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Nächste Fälligkeit</div><div className="mono">{due}</div></div>
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Intervall</div><div>{g.kalibrierIntervallMonate} Monate</div></div>
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Software</div><div className="mono ver">{g.softwareVersion}</div></div>
            <div><div className="subh" style={{ margin: "0 0 4px" }}>Ausgeliefert</div><div className="mono">{g.ausgeliefert}</div></div>
          </div>

          {!isIntern && <button className="btn" style={{ marginTop: 16 }} onClick={requestCalib}>Kalibrierung anfragen</button>}

          {isIntern && (form ? (
            <div className="frm" style={{ marginTop: 16 }}>
              <div className="subh" style={{ margin: 0 }}>{form.mode === "kalib" ? "Kalibrierung erfassen" : "Software-Update erfassen"}</div>
              <div className="rowf">
                <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} />
                {form.mode === "kalib"
                  ? <select value={form.ergebnis} onChange={(e) => setForm({ ...form, ergebnis: e.target.value })}>
                      <option value="in Toleranz">in Toleranz</option>
                      <option value="außerhalb Toleranz">außerhalb Toleranz</option>
                    </select>
                  : <input placeholder="Version, z. B. 5.29.1" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />}
              </div>
              {form.mode === "software" && <input placeholder="Hinweis (optional)" value={form.hinweis} onChange={(e) => setForm({ ...form, hinweis: e.target.value })} />}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn sm" onClick={save}>Speichern</button>
                <button className="btn ghost sm" onClick={() => setForm(null)}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <button className="btn sm" onClick={() => setForm({ mode: "kalib", datum: td, ergebnis: "in Toleranz" })}>+ Kalibrierung erfassen</button>
              <button className="btn ghost sm" onClick={() => setForm({ mode: "software", datum: td, version: "", hinweis: "" })}>+ Software-Update</button>
            </div>
          ))}

          <div className="subh">Service-Historie</div>
          {historie.length === 0 && <div className="muted small">Noch keine Einträge.</div>}
          <ul className="tl">
            {historie.map((e, i) => {
              const meta = HISTORIE_ART[e.art] || { label: e.art, icon: "•" };
              return (
                <li className="tli" key={i}>
                  <span className="when">{e.datum}</span>
                  <div className="body">
                    <div className="tt"><span className="histart">{meta.icon} {meta.label}</span></div>
                    <div className="ii"><EintragDetail e={e} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="note" style={{ fontStyle: "normal" }}>Zertifikat-Download im Prototyp nicht hinterlegt.</div>
        </div>
      </div>
    </div>
  );
}
