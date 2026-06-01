import { STAGES, STATUS_STYLE, stageIdx } from "../data/portal.js";

export function Status({ s }) {
  const st = STATUS_STYLE[s] || { bg: "#EDE6D7", fg: "#7A6F5C" };
  return <span className="chip" style={{ background: st.bg, color: st.fg }}>{s}</span>;
}

export function AccChip({ p }) {
  return p.angenommen
    ? <span className="chip" style={{ background: "#DCE7DC", color: "#3F6B3F" }}>✓ angenommen</span>
    : <span className="chip" style={{ background: "#F3E7CE", color: "#8A5A00" }}>offen</span>;
}

export function Stepper({ stage }) {
  const ci = stageIdx(stage);
  return (
    <div className="stepper">
      {STAGES.map((s, i) => (
        <div key={s.key} className={"step " + (i < ci ? "done" : i === ci ? "cur" : "")}>
          <span className="pt" />
          <div className="lb">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
