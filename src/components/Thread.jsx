import { useRef, useState } from "react";
import { useStore } from "../store.jsx";
import { PRIORITIES } from "../data/portal.js";

// Anhänge: hochgeladene liegen als data:-URL vor, Seed-Anhänge als Pfad unter public/.
const assetUrl = (u) => (u.startsWith("data:") || u.startsWith("http") ? u : import.meta.env.BASE_URL + u);

function Attachment({ a }) {
  const url = assetUrl(a.url);
  if (a.typ === "bild") return <a href={url} target="_blank" rel="noreferrer"><img className="att-img" src={url} alt={a.name} loading="lazy" /></a>;
  return <a className="att-file" href={url} target="_blank" rel="noreferrer">📄 {a.name}</a>;
}

/* Konversations-Thread: zusammenhängend, mit Priorität und „als gelöst markieren".
   Nachrichten können Bilder/PDFs als Anhang tragen. */
export default function Thread({ title, messages, resolved, prioritaet = "normal", onToggleResolved, onPriority, onSend, placeholder, emptyText = "Noch keine Nachrichten." }) {
  const { isIntern } = useStore();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState([]); // [{name, typ, url}]
  const [sent, setSent] = useState(false);
  const fileRef = useRef(null);

  const onFiles = (e) => {
    [...e.target.files].forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const typ = f.type.startsWith("image/") ? "bild" : f.type === "application/pdf" ? "pdf" : "datei";
        setPending((p) => [...p, { name: f.name, typ, url: reader.result }]);
        setSent(false);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const send = () => {
    if (!draft.trim() && pending.length === 0) return;
    onSend(draft.trim(), pending);
    setDraft(""); setPending([]); setSent(true);
  };

  return (
    <div className={"thread prio-" + prioritaet + (resolved ? " resolved" : "")}>
      <div className="thread-head">
        <span className="thread-title">{title}</span>
        <div className="thread-head-right">
          {onPriority && (
            <select className="statsel" value={prioritaet} onChange={(e) => onPriority(e.target.value)} title="Priorität">
              {PRIORITIES.map((p) => <option key={p} value={p}>Priorität: {p}</option>)}
            </select>
          )}
          {resolved && <span className="thread-status">✓ Gelöst</span>}
        </div>
      </div>

      <div className="thread-body">
        {messages.length === 0 && <div className="muted small">{emptyText}</div>}
        {messages.map((m, i) => {
          const mine = isIntern ? m.dir === "out" : m.dir === "in";
          return (
            <div className={"tmsg " + (mine ? "mine" : "their")} key={i}>
              <div className="tmeta">{mine ? "Sie" : isIntern ? "Kunde" : "Wir"}{m.datum ? " · " + m.datum : ""}</div>
              {m.text && <div className="tbubble">{m.text}</div>}
              {m.anhaenge?.length > 0 && <div className="att-row">{m.anhaenge.map((a, j) => <Attachment a={a} key={j} />)}</div>}
            </div>
          );
        })}
      </div>

      {resolved ? (
        <div className="thread-foot resolved-foot">
          <span className="muted small">Als gelöst markiert.</span>
          <button className="linkbtn" onClick={onToggleResolved}>Erneut öffnen</button>
        </div>
      ) : (
        <div className="thread-foot">
          <textarea placeholder={placeholder} value={draft} onChange={(e) => { setDraft(e.target.value); setSent(false); }} />
          {pending.length > 0 && (
            <div className="att-pending">
              {pending.map((a, i) => (
                <span className="att-chip" key={i}>{a.typ === "bild" ? "🖼" : "📄"} {a.name}
                  <button onClick={() => setPending((p) => p.filter((_, j) => j !== i))} aria-label="Entfernen">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="thread-actions">
            <button className="btn sm" onClick={send}>Senden</button>
            <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>📎 Anhang</button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={onFiles} />
            {sent && <span className="sent">✓ gesendet</span>}
            {messages.length > 0 && onToggleResolved && <button className="btn ghost sm" onClick={onToggleResolved}>Als gelöst markieren</button>}
          </div>
        </div>
      )}
    </div>
  );
}
