import { useState } from "react";
import { useStore } from "../store.jsx";
import { STATI } from "../data/portal.js";
import { Status } from "./ui.jsx";
import Thread from "./Thread.jsx";
import NewThreadForm from "./NewThreadForm.jsx";

/* Positions-Detail als Modal/Bottom-Sheet: Beschreibung, Teilaufgaben (rollenabhängig
   sichtbar/bearbeitbar) und Rückfrage-Threads zu dieser Position. */
export default function PositionSheet({ ord, pos, onClose }) {
  const { isIntern, vTasks, setTaskStatus, addPositionTask, sendThreadMsg, createThread, setThreadResolved, setThreadPriority, setThreadTitle } = useStore();
  const [taskForm, setTaskForm] = useState(null);
  const [newThread, setNewThread] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const posThreads = ord.threads.filter((t) => t.positionId === pos.id);
  const posResolved = posThreads.filter((t) => t.geloest).length;
  const visiblePos = showResolved ? posThreads : posThreads.filter((t) => !t.geloest);

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
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>{pos.beschreibung}</div>
          <div className="pbetrag" style={{ marginTop: 10 }}>Position: {pos.betrag}</div>

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

          <div className="subh" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>Rückfragen zur Position</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {posResolved > 0 && <button className="linkbtn" onClick={() => setShowResolved((v) => !v)}>{showResolved ? "Gelöste ausblenden" : "Gelöste anzeigen (" + posResolved + ")"}</button>}
              {!newThread && <button className="btn ghost sm" onClick={() => setNewThread(true)}>+ Rückfrage</button>}
            </span>
          </div>
          {newThread && <NewThreadForm defaultTitel={"Rückfrage: " + pos.titel} onCancel={() => setNewThread(false)} onCreate={(d) => { createThread(ord.id, { ...d, positionId: pos.id }, d.text); setNewThread(false); }} />}
          {visiblePos.length === 0 && !newThread && <div className="muted small">{posThreads.length === 0 ? "Noch keine Rückfragen zu dieser Position." : "Keine offenen Rückfragen."}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {visiblePos.map((t) => (
              <Thread
                key={t.id}
                title={t.titel}
                messages={t.nachrichten}
                resolved={t.geloest}
                prioritaet={t.prioritaet}
                onPriority={(v) => setThreadPriority(ord.id, t.id, v)}
                onTitle={(v) => setThreadTitle(ord.id, t.id, v)}
                onToggleResolved={() => setThreadResolved(ord.id, t.id, !t.geloest)}
                onSend={(text, anh) => sendThreadMsg(ord.id, t.id, text, anh)}
                placeholder={isIntern ? "Antwort zu dieser Position …" : "Rückfrage zu dieser Position …"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
