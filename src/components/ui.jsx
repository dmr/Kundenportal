import { STAGES, STATUS_STYLE, stageIdx } from "../data/portal.js";

/* Macht ein klickbares Nicht-Button-Element (div/li) tastaturbedienbar:
   role="button", fokussierbar und Auslösen per Enter/Leertaste. */
export const clickable = (onClick) => ({
  role: "button",
  tabIndex: 0,
  onClick,
  onKeyDown: (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); }
  },
});

export function Status({ s }) {
  const st = STATUS_STYLE[s] || { bg: "#EDE6D7", fg: "#7A6F5C" };
  return <span className="chip" style={{ background: st.bg, color: st.fg }}>{s}</span>;
}

export function Stepper({ stage }) {
  const ci = stageIdx(stage);
  // Beim Abschluss (letzte Stage) ist auch der letzte Punkt erledigt, nicht "current".
  const isFinal = ci === STAGES.length - 1;
  return (
    <div className="stepper">
      {STAGES.map((s, i) => {
        const cls = i < ci || (isFinal && i === ci) ? "done" : i === ci ? "cur" : "";
        return (
          <div key={s.key} className={"step " + cls}>
            <span className="pt" />
            <div className="lb">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
