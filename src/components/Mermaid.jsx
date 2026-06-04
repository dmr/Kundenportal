import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let inited = false;
function ensureInit() {
  if (inited) return;
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
  inited = true;
}

let seq = 0;

/* Rendert ein mermaid-Diagramm. mermaid wird statisch importiert (initial geladen). */
export default function Mermaid({ chart }) {
  const [svg, setSvg] = useState("");
  const [err, setErr] = useState(false);
  const idRef = useRef("mmd" + (++seq));

  useEffect(() => {
    let alive = true;
    ensureInit();
    mermaid.render(idRef.current, chart)
      .then(({ svg }) => { if (alive) { setSvg(svg); setErr(false); } })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, [chart]);

  if (err) return <div className="empty">Diagramm konnte nicht geladen werden.</div>;
  if (!svg) return <div className="muted small">Diagramm wird geladen …</div>;
  return <div className="mermaid-wrap" dangerouslySetInnerHTML={{ __html: svg }} />;
}
