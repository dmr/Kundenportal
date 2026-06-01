import { useState } from "react";
import { useStore } from "../store.jsx";

/* Zusammenhängender Konversations-Thread (statt einzelner Boxen).
   Eigene Nachrichten rechts, Gegenseite links. Kann als gelöst markiert und
   wieder geöffnet werden; eine neue Nachricht öffnet den Thread automatisch. */
export default function Thread({ title, messages, resolved, onToggleResolved, onSend, placeholder, emptyText = "Noch keine Nachrichten." }) {
  const { isIntern } = useStore();
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!draft.trim()) return;
    onSend(draft.trim());
    setDraft(""); setSent(true);
  };

  return (
    <div className={"thread" + (resolved ? " resolved" : "")}>
      <div className="thread-head">
        <span className="thread-title">{title}</span>
        {resolved && <span className="thread-status">✓ Gelöst</span>}
      </div>

      <div className="thread-body">
        {messages.length === 0 && <div className="muted small">{emptyText}</div>}
        {messages.map((m, i) => {
          const mine = isIntern ? m.dir === "out" : m.dir === "in";
          return (
            <div className={"tmsg " + (mine ? "mine" : "their")} key={i}>
              <div className="tmeta">{mine ? "Sie" : isIntern ? "Kunde" : "Wir"}{m.datum ? " · " + m.datum : ""}</div>
              <div className="tbubble">{m.text}</div>
            </div>
          );
        })}
      </div>

      {resolved ? (
        <div className="thread-foot resolved-foot">
          <span className="muted small">Von Ihnen als gelöst markiert.</span>
          <button className="linkbtn" onClick={onToggleResolved}>Erneut öffnen</button>
        </div>
      ) : (
        <div className="thread-foot">
          <textarea placeholder={placeholder} value={draft} onChange={(e) => { setDraft(e.target.value); setSent(false); }} />
          <div className="thread-actions">
            <button className="btn sm" onClick={send}>Senden</button>
            {sent && <span className="sent">✓ gesendet</span>}
            {messages.length > 0 && onToggleResolved && <button className="btn ghost sm" onClick={onToggleResolved}>Als gelöst markieren</button>}
          </div>
        </div>
      )}
    </div>
  );
}
