import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { clickable } from "../components/ui.jsx";

export default function Inbox() {
  const { handlungsbedarf, latestIncoming } = useStore();
  const nav = useNavigate();

  return (
    <>
      <div className="h1 serif">Posteingang</div>
      <div className="lede">Neue Anfragen und unbeantwortete Rückfragen.</div>
      {handlungsbedarf.length === 0 && <div className="card"><div className="empty">Nichts offen.</div></div>}
      {handlungsbedarf.map(({ k, o }) => {
        const li = latestIncoming(o);
        return (
          <div className="card" key={o.id} style={{ marginBottom: 14, padding: "16px 20px", cursor: "pointer" }} {...clickable(() => nav("/auftrag/" + o.id))}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
              <span className="mono">{li?.from}</span><span className="mono">{li?.datum}</span>
            </div>
            <div style={{ fontWeight: 600, margin: "6px 0 4px" }}>{k === "anfrage" ? "🆕 Anfrage ohne Auftrag · " : "↩ Rückfrage · "}{li?.betreff}</div>
            <div style={{ fontSize: 14 }}>{li?.body}</div>
            <div style={{ marginTop: 8 }}><span className="link">Vorgang öffnen & antworten →</span></div>
          </div>
        );
      })}
    </>
  );
}
