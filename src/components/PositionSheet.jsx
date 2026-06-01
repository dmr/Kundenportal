import { useState } from "react";
import { useStore } from "../store.jsx";
import { STATI } from "../data/portal.js";
import { Status, AccChip } from "./ui.jsx";

/* Positions-Detail als Modal/Bottom-Sheet: Beschreibung, Teilaufgaben (rollenabhängig
   sichtbar/bearbeitbar), Rückfragen-Thread und – für Kunden – "Position annehmen". */
export default function PositionSheet({ ord, pos, onClose }) {
  const { isIntern, vTasks, setTaskStatus, addPositionTask, sendPosMsg, acceptPosition } = useStore();
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [taskForm, setTaskForm] = useState(null);

  const send = () => {
    if (!draft.trim()) return;
    sendPosMsg(ord.id, pos.id, draft);
    setDraft(""); setSent(true);
  };
  const addTask = () => {
    if (!taskForm?.titel?.trim()) return;
    addPositionTask(ord.id, pos.id, taskForm);
    setTaskForm(null);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet wide" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top"><strong>{pos.titel}</strong><button className="x" onClick={onClose}>×</button></div>
        <div className="sheet-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span className="pbetrag" style={{ fontSize: 18 }}>{pos.betrag}</span><AccChip p={pos} />
          </div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>{pos.beschreibung}</div>

          <div className="subh">Teilaufgaben</div>
          {vTasks(pos).length === 0 && <div className="muted small">Keine Teilaufgaben.</div>}
          {vTasks(pos).map((t) => (
            <div className="taskcard" key={t.id}><div className="tcrow">
              <div className="grow">
                <div className="tcname">{t.titel}{t.sicht === "intern" && <span className="internbadge" style={{ marginLeft: 8 }}>nur intern</span>}</div>
                <div className="tcmeta">{isIntern && t.verantwortlich ? t.verantwortlich + " · " : ""}{t.faellig ? "fällig " + t.faellig : "kein Termin"}</div>
              </div>
              {isIntern
                ? <select className="statsel" value={t.status} onChange={(e) => setTaskStatus(ord.id, pos.id, t.id, e.target.value)}>{STATI.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                : <Status s={t.status} />}
            </div></div>
          ))}
          {isIntern && (taskForm ? (
            <div className="frm">
              <input placeholder="Teilaufgabe" value={taskForm.titel} onChange={(e) => setTaskForm({ ...taskForm, titel: e.target.value })} />
              <div className="rowf">
                <input placeholder="Verantwortlich" value={taskForm.verantwortlich} onChange={(e) => setTaskForm({ ...taskForm, verantwortlich: e.target.value })} />
                <input type="date" value={taskForm.faellig} onChange={(e) => setTaskForm({ ...taskForm, faellig: e.target.value })} />
                <select value={taskForm.sicht} onChange={(e) => setTaskForm({ ...taskForm, sicht: e.target.value })}>
                  <option value="kunde">Für Kunde sichtbar</option><option value="intern">Nur intern</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn sm" onClick={addTask}>Hinzufügen</button>
                <button className="btn ghost sm" onClick={() => setTaskForm(null)}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => setTaskForm({ titel: "", sicht: "kunde", verantwortlich: "", faellig: "" })}>+ Teilaufgabe</button>
          ))}

          <div className="subh">Rückfragen zur Position</div>
          <div className="qa">
            {pos.rueckfragen.length === 0 && <div className="muted small">Keine Rückfragen.</div>}
            {pos.rueckfragen.map((m, i) => (
              <div className={"m " + m.dir} key={i}><div className="meta">{m.dir === "in" ? "Kunde · " + m.from : "Wir"} · {m.datum}</div>{m.text}</div>
            ))}
          </div>
          <div className="composer2">
            <textarea placeholder={isIntern ? "Antwort zu dieser Position …" : "Rückfrage zu dieser Position …"} value={draft} onChange={(e) => { setDraft(e.target.value); setSent(false); }} />
            <div className="actions">
              <button className="btn sm" onClick={send}>{isIntern ? "Antwort senden" : "Rückfrage senden"}</button>
              {sent && <span className="sent">✓ gesendet</span>}
              {!isIntern && !pos.angenommen && <button className="btn" onClick={() => acceptPosition(ord.id, pos.id)}>Position annehmen</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
