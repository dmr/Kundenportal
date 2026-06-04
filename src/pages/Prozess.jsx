import { useState } from "react";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx } from "../data/portal.js";
import Mermaid from "../components/Mermaid.jsx";

// Einfacher, linearer Ablauf mit einer Verzweigung (Beteiligte je Schritt in Klammern).
const DIAGRAM = `
flowchart TD
  A["Anfrage<br/>(Kunde)"] --> B["Angebot erstellen<br/>(Team)"]
  B --> C{"Angebot prüfen<br/>(Kunde)"}
  C -- "Rückfrage" --> B
  C -- "annehmen" --> D["Auftrag &amp; Bestellung<br/>(Team)"]
  D --> E["Kalibrierung / Service<br/>(Werkstatt · Labor)"]
  E --> F["Lieferung &amp; Zertifikat<br/>(Disposition)"]
  F --> G["Abgeschlossen"]
`;

const BETEILIGTE = [
  { name: "Kunde", desc: "stellt Anfragen, prüft Angebote, verfolgt Fortschritt, erhält Zertifikate", c: "var(--accent)" },
  { name: "Team · Innendienst", desc: "sichtet Anfragen, erstellt Angebote, steuert Status & Kommunikation", c: "var(--intern)" },
  { name: "Werkstatt · Kalibrierlabor", desc: "führt Teilaufgaben/Kalibrierung aus, stellt Zertifikate aus", c: "#3F6B3F" },
  { name: "Disposition · Logistik", desc: "plant Touren und liefert aus", c: "#8A5A00" },
];

// Linearer Stufen-Ablauf eines konkreten Vorgangs mit hervorgehobenem aktuellem Schritt.
function orderFlow(stage) {
  const ci = stageIdx(stage);
  const nodes = STAGES.map((s, i) => `S${i}["${s.label}"]`);
  const edges = STAGES.slice(0, -1).map((_, i) => `S${i} --> S${i + 1}`);
  const classes = STAGES.map((_, i) => (i < ci ? `class S${i} done;` : i === ci ? `class S${i} cur;` : ""));
  return [
    "flowchart LR",
    "  classDef done fill:#DCE7DC,stroke:#3F6B3F,color:#211C14;",
    "  classDef cur fill:#B5460F,stroke:#B5460F,color:#fff;",
    "  " + nodes.join("\n  "),
    "  " + edges.join("\n  "),
    "  " + classes.filter(Boolean).join("\n  "),
  ].join("\n");
}

export default function Prozess() {
  const { isIntern, db, meCust, ordersOf } = useStore();
  const orders = isIntern ? db.orders : (meCust ? ordersOf(meCust.id) : []);
  const [sel, setSel] = useState(orders[0]?.id || "");
  const ord = orders.find((o) => o.id === sel);
  const ci = ord ? stageIdx(ord.stage) : -1;

  return (
    <>
      <div className="h1 serif">{isIntern ? "Prozess" : "So läuft Ihr Auftrag ab"}</div>
      <div className="lede">{isIntern
        ? "Auftrags- und Kalibrierablauf über alle Beteiligten — von der Anfrage bis zum Zertifikat."
        : "Vom ersten Kontakt bis zum Zertifikat — und wo Ihr Auftrag gerade steht."}</div>

      {/* Aktueller Stand eines konkreten Vorgangs */}
      {orders.length > 0 && (
        <>
          <div className="sec" style={{ marginTop: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span>Aktueller Stand</span>
            <select value={sel} onChange={(e) => setSel(e.target.value)} style={{ font: "inherit", fontSize: 13, padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }}>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.titel}{o.auftragsNr ? " · " + o.auftragsNr : ""}</option>)}
            </select>
          </div>
          {ord && (
            <div className="card" style={{ padding: 20, marginBottom: 8, overflowX: "auto" }}>
              <Mermaid chart={orderFlow(ord.stage)} />
            </div>
          )}
          {ord && <div className="note" style={{ fontStyle: "normal" }}>Aktuell: Schritt {ci + 1} von 6 — {STAGES[ci].kunde}.</div>}
        </>
      )}

      <div className="sec">Beteiligte</div>
      <div className="card" style={{ marginBottom: 22 }}>
        {BETEILIGTE.map((b) => (
          <div className="row" key={b.name} style={{ cursor: "default" }}>
            <span className="lane-dot" style={{ background: b.c }} />
            <div className="grow"><div className="name">{b.name}</div><div className="meta">{b.desc}</div></div>
          </div>
        ))}
      </div>

      <div className="sec">Gesamter Ablauf</div>
      <div className="card" style={{ padding: 20, overflowX: "auto" }}>
        <Mermaid chart={DIAGRAM} />
      </div>
      <div className="note" style={{ fontStyle: "normal" }}>Entscheidung „Angebot prüfen": Annahme startet die Umsetzung, eine Rückfrage setzt das Angebot auf „in Klärung" und führt zur Überarbeitung.</div>
    </>
  );
}
