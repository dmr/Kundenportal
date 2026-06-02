import { useEffect, useState } from "react";

/* Ablaufdiagramm des Auftrags-/Kalibrierprozesses über alle Beteiligten.
   mermaid wird dynamisch geladen (eigener Chunk). */
const DIAGRAM = `
flowchart TD
  subgraph KUNDE["Kunde"]
    direction TB
    K1["Anfrage stellen (Kalibrierung / Service / Sonstiges)"]
    K2{"Angebot prüfen"}
    K3["Fortschritt verfolgen"]
    K4["Lieferung &amp; Zertifikat erhalten"]
  end
  subgraph TEAM["Team · Innendienst"]
    direction TB
    T1["Anfrage im Posteingang sichten"]
    T2["Angebot mit Positionen erstellen"]
    T3["Auftrag bestätigen &amp; Bestellung auslösen"]
    T4["Status pflegen · Rückfragen beantworten"]
  end
  subgraph LABOR["Werkstatt · Kalibrierlabor"]
    direction TB
    L1["Teilaufgaben ausführen"]
    L2["Kalibrierung / Service durchführen"]
    L3["Kalibrierzertifikat ausstellen"]
  end
  subgraph LOG["Disposition · Logistik"]
    direction TB
    D1["Auslieferung planen &amp; zustellen"]
  end

  K1 --> T1 --> T2 --> K2
  K2 -- "annehmen" --> T3
  K2 -- "Rückfrage (in Klärung)" --> T4
  T4 --> T2
  T3 --> L1
  T3 --> L2
  L1 --> D1
  L2 --> L3
  D1 --> K3
  L3 --> K3
  K3 --> K4
`;

const BETEILIGTE = [
  { name: "Kunde", desc: "stellt Anfragen, prüft Angebote, verfolgt Fortschritt, erhält Zertifikate", c: "var(--accent)" },
  { name: "Team · Innendienst", desc: "sichtet Anfragen, erstellt Angebote, steuert Status & Kommunikation", c: "var(--intern)" },
  { name: "Werkstatt · Kalibrierlabor", desc: "führt Teilaufgaben/Kalibrierung aus, stellt Zertifikate aus", c: "#3F6B3F" },
  { name: "Disposition · Logistik", desc: "plant Touren und liefert aus", c: "#8A5A00" },
];

export default function Prozess() {
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
            primaryColor: "#FBF8F2", primaryBorderColor: "#E2D9C8", primaryTextColor: "#211C14",
            lineColor: "#B5460F", clusterBkg: "#F4EFE6", clusterBorder: "#E2D9C8",
          },
        });
        const { svg } = await mermaid.render("prozessGraph", DIAGRAM);
        if (alive) setSvg(svg);
      } catch (e) {
        if (alive) setErr(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <>
      <div className="h1 serif">Prozess</div>
      <div className="lede">Auftrags- und Kalibrierablauf über alle Beteiligten — von der Anfrage bis zum Zertifikat.</div>

      <div className="sec" style={{ marginTop: 0 }}>Beteiligte</div>
      <div className="card" style={{ marginBottom: 22 }}>
        {BETEILIGTE.map((b) => (
          <div className="row" key={b.name} style={{ cursor: "default" }}>
            <span className="lane-dot" style={{ background: b.c }} />
            <div className="grow"><div className="name">{b.name}</div><div className="meta">{b.desc}</div></div>
          </div>
        ))}
      </div>

      <div className="sec">Ablauf</div>
      <div className="card" style={{ padding: 20, overflowX: "auto" }}>
        {err
          ? <div className="empty">Diagramm konnte nicht geladen werden.</div>
          : svg
            ? <div className="mermaid-wrap" dangerouslySetInnerHTML={{ __html: svg }} />
            : <div className="muted small">Diagramm wird geladen …</div>}
      </div>
      <div className="note" style={{ fontStyle: "normal" }}>Entscheidung „Angebot prüfen": Annahme startet die Umsetzung, eine Rückfrage setzt das Angebot auf „in Klärung" und führt zur Überarbeitung.</div>
    </>
  );
}
