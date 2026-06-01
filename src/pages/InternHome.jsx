import { useNavigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, stageIdx } from "../data/portal.js";
import { Status, clickable } from "../components/ui.jsx";

export default function InternHome() {
  const { db, handlungsbedarf, custOf, latestIncoming } = useStore();
  const nav = useNavigate();
  const openOrder = (id) => nav("/auftrag/" + id);

  return (
    <>
      <div className="h1 serif">Übersicht</div>
      <div className="lede">Offene Punkte über alle Kunden.</div>
      <div className="kpis">
        <div className="kpi"><div className="num">{db.orders.filter((o) => o.stage !== "abgeschlossen").length}</div><div className="k">Aktive Vorgänge</div></div>
        <div className={"kpi" + (handlungsbedarf.length ? " alert" : "")}><div className="num">{handlungsbedarf.length}</div><div className="k">Handlungsbedarf</div></div>
        <div className="kpi"><div className="num">{db.orders.filter((o) => o.angebot && o.angebot.status === "offen").length}</div><div className="k">Offene Angebote</div></div>
      </div>

      <div className="sec" style={{ marginTop: 0 }}>Handlungsbedarf</div>
      <div className="card">
        {handlungsbedarf.length === 0 && <div className="empty">Alles erledigt.</div>}
        {handlungsbedarf.map(({ k, o }) => (
          <div className="act" key={o.id} {...clickable(() => openOrder(o.id))}>
            <span className="dot" style={{ background: k === "anfrage" ? "#8A5A00" : "var(--accent)" }} />
            <div className="grow">
              <div className="t">{k === "anfrage" ? "Neue Anfrage – noch kein Auftrag" : "Offene Rückfrage"}: {o.titel}</div>
              <div className="s">{custOf(o.customerId)?.name} · {latestIncoming(o)?.betreff || ""}</div>
            </div>
            <span className="link">öffnen →</span>
          </div>
        ))}
      </div>

      <div className="sec">Aktive Vorgänge</div>
      <div className="card">
        {db.orders.filter((o) => o.stage !== "abgeschlossen").map((o) => (
          <div className="row" key={o.id} {...clickable(() => openOrder(o.id))}>
            <span className={"tlwtag" + (o.tlw ? "" : " none")}>{o.tlw || "Anfrage"}</span>
            <div className="grow">
              <div className="name">{o.titel} {o.auftragsNr && <span className="typ">· {o.auftragsNr}</span>}</div>
              <div className="meta">{custOf(o.customerId)?.name} · {o.typ}</div>
            </div>
            <Status s={STAGES[stageIdx(o.stage)].label} />
          </div>
        ))}
      </div>
    </>
  );
}
