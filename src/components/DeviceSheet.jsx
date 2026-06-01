import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { calibStatus, calibNextDue, today, HISTORIE_ART, STAGES, stageIdx } from "../data/portal.js";
import { Status, clickable } from "./ui.jsx";

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

/* Gerätedetail als Sheet. Fokus: das Gerät und sein Verlauf (alle Aufträge +
   Service-Historie). Kalibrierung steht bewusst als eigener Abschnitt am Ende. */
export default function DeviceSheet({ geraet: g, onClose }) {
  const { isIntern, addCalibration, addSoftwareUpdate, setNewAnfrage, ordersForGeraet } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState(null); // { mode, datum, ergebnis?, version?, hinweis? }
  const td = today();
  const historie = [...g.historie].sort((a, b) => (a.datum < b.datum ? 1 : -1));
  const orders = ordersForGeraet(g.id).slice().sort((a, b) => (a.datum < b.datum ? 1 : -1));

  const openOrder = (id) => { onClose(); nav("/auftrag/" + id); };
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
          {/* Das Gerät selbst – Identität & Stolz */}
          {g.bild && <img className="devimg" src={import.meta.env.BASE_URL + g.bild} alt={g.bezeichnung} loading="lazy" />}
          <div className="muted small">{g.hersteller} · {g.typ}</div>
          <div className="muted small" style={{ marginTop: 4 }}>SN <span className="mono">{g.seriennummer}</span> · im Einsatz seit {g.ausgeliefert} · Software <span className="mono ver">{g.softwareVersion}</span></div>

          {/* Was ist mit dem Gerät passiert – alle Aufträge */}
          <div className="subh">Aufträge zu diesem Gerät</div>
          {orders.length === 0 && <div className="muted small">Noch keine Aufträge.</div>}
          {orders.map((o) => (
            <div className="taskcard" key={o.id} {...clickable(() => openOrder(o.id))} style={{ cursor: "pointer" }}>
              <div className="tcrow">
                <div className="grow">
                  <div className="tcname">{o.titel}</div>
                  <div className="tcmeta">{o.typ} · {o.datum}</div>
                </div>
                <Status s={STAGES[stageIdx(o.stage)].label} />
                <span className="chev">›</span>
              </div>
            </div>
          ))}

          {/* Technischer Verlauf (Scheckheft) */}
          <div className="subh">Verlauf</div>
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

          {/* Kalibrierung – bewusst als eigener, expliziter Abschnitt */}
          <div className="subh">Kalibrierung</div>
          <div className="devgrid">
            <div><div className="muted small" style={{ marginBottom: 4 }}>Status</div><Status s={calibStatus(g, td)} /></div>
            <div><div className="muted small" style={{ marginBottom: 4 }}>Nächste Fälligkeit</div><div className="mono">{calibNextDue(g)}</div></div>
            <div><div className="muted small" style={{ marginBottom: 4 }}>Intervall</div><div>{g.kalibrierIntervallMonate} Monate</div></div>
          </div>

          {!isIntern && <button className="btn sm" style={{ marginTop: 14 }} onClick={requestCalib}>Kalibrierung anfragen</button>}

          {isIntern && (form ? (
            <div className="frm" style={{ marginTop: 14 }}>
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
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button className="btn sm" onClick={() => setForm({ mode: "kalib", datum: td, ergebnis: "in Toleranz" })}>+ Kalibrierung erfassen</button>
              <button className="btn ghost sm" onClick={() => setForm({ mode: "software", datum: td, version: "", hinweis: "" })}>+ Software-Update</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
