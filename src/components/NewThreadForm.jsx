import { useState } from "react";
import { PRIORITIES } from "../data/portal.js";

/* Kleines Formular zum Eröffnen eines neuen, benannten Threads (mit Priorität). */
export default function NewThreadForm({ defaultTitel = "", onCreate, onCancel }) {
  const [titel, setTitel] = useState(defaultTitel);
  const [prioritaet, setPrioritaet] = useState("normal");
  const [text, setText] = useState("");

  const create = () => {
    if (!titel.trim() || !text.trim()) return;
    onCreate({ titel: titel.trim(), prioritaet, text: text.trim() });
  };

  return (
    <div className="frm" style={{ marginBottom: 14 }}>
      <div className="rowf">
        <input placeholder="Thema / Betreff" value={titel} onChange={(e) => setTitel(e.target.value)} />
        <select value={prioritaet} onChange={(e) => setPrioritaet(e.target.value)} style={{ flex: "0 0 auto" }}>
          {PRIORITIES.map((p) => <option key={p} value={p}>Priorität: {p}</option>)}
        </select>
      </div>
      <textarea placeholder="Ihre Nachricht …" style={{ minHeight: 70 }} value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn sm" onClick={create}>Thema erstellen</button>
        <button className="btn ghost sm" onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  );
}
