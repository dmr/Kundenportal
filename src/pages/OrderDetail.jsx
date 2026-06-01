import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, STATI, stageIdx, parseEUR, fmtEUR } from "../data/portal.js";
import { Status, AccChip, Stepper } from "../components/ui.jsx";
import PositionSheet from "../components/PositionSheet.jsx";

export default function OrderDetail() {
  const { ordId } = useParams();
  const { orderById, custOf, isIntern, meCust, vTasks, lastIn, sendGen, setIPStatus, setStage } = useStore();
  const [openPosId, setOpenPosId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);

  const ord = orderById(ordId);
  if (!ord) return <Navigate to={isIntern ? "/intern" : "/kunde"} replace />;
  // Kunde darf nur eigene Vorgänge sehen.
  if (!isIntern && ord.customerId !== meCust?.id) return <Navigate to="/kunde" replace />;

  const openPos = openPosId ? ord.angebot?.positionen.find((p) => p.id === openPosId) : null;
  const ci = stageIdx(ord.stage), s = STAGES[ci];

  const send = () => {
    if (!draft.trim()) return;
    sendGen(ord.id, draft);
    setDraft(""); setSent(true);
  };

  return (
    <>
      <div className="ord-head">
        <span className={"tlwtag" + (ord.tlw ? "" : " none")}>{ord.tlw || "Anfrage"}</span>
        <div className="h1 serif" style={{ fontSize: 25 }}>{ord.titel}</div>
        <span className="typ">{ord.typ}{ord.auftragsNr ? " · " + ord.auftragsNr : ""}</span>
      </div>
      <div className="lede">{custOf(ord.customerId)?.name} · angelegt {ord.datum}</div>

      <Stepper stage={ord.stage} />
      <div className="statusbox">
        <div className="big">Schritt {ci + 1} von 6 — {s.kunde}</div>
        <div className="sm">{ci < STAGES.length - 1 ? "Nächster Schritt: " + STAGES[ci + 1].label : "Vorgang abgeschlossen."}</div>
        {ci < stageIdx("auftrag") && <div className="warnline">⚠ Noch <b>&nbsp;kein Auftrag</b>.</div>}
        {ci >= stageIdx("auftrag") && ci < stageIdx("bestellung") && <div className="warnline">⚠ Auftrag bestätigt, aber noch <b>&nbsp;keine Bestellung</b>.</div>}
      </div>

      {isIntern && (
        <div className="frm" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <span className="typ">Status setzen:</span>
          <select value={ord.stage} onChange={(e) => setStage(ord.id, e.target.value)} style={{ flex: "0 0 auto", width: "auto" }}>
            {STAGES.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
          </select>
          <span className="note" style={{ margin: 0 }}>Nur intern – steuert den Fortschritt für den Kunden.</span>
        </div>
      )}

      {ord.angebot ? (
        <>
          <div className="dual">
            <div className="sumcard">
              <div className="subh" style={{ margin: 0 }}>Angebot</div>
              <div className="sumnr mono">{ord.angebot.nr}</div>
              <div className="big">{fmtEUR(ord.angebot.positionen.reduce((sum, p) => sum + parseEUR(p.betrag), 0))}</div>
              <div className="summeta">vom {ord.angebot.datum}</div>
              <Status s={ord.angebot.status} />
              <div className="accprog">{ord.angebot.positionen.filter((p) => p.angenommen).length} / {ord.angebot.positionen.length} Positionen angenommen</div>
            </div>
            <div className="sumcard">
              <div className="subh" style={{ margin: 0 }}>Bestellung</div>
              {ord.bestellung
                ? <><div className="sumnr mono">{ord.bestellung.nr}</div><div className="summeta">vom {ord.bestellung.datum}</div><Status s={ord.bestellung.status} /></>
                : <div className="summeta" style={{ marginTop: 10 }}>Noch keine Bestellung erfasst.</div>}
              {ord.lieferschein && <div className="summeta" style={{ marginTop: 12 }}>Lieferschein <span className="mono">{ord.lieferschein.nr}</span> · <Status s={ord.lieferschein.status} /></div>}
            </div>
          </div>

          <div className="sec" style={{ marginTop: 4 }}>Positionen <span className="note" style={{ margin: 0, fontStyle: "normal" }}>· antippen für Details</span></div>
          <div className="card">
            {ord.angebot.positionen.map((p) => {
              const done = vTasks(p).filter((t) => t.status === "erledigt").length, tot = vTasks(p).length;
              return (
                <div className="row" key={p.id} onClick={() => setOpenPosId(p.id)}>
                  <div className="grow">
                    <div className="name">{p.titel}</div>
                    <div className="meta">{tot > 0 ? done + "/" + tot + " Teilaufgaben erledigt" : "keine Teilaufgaben"} · {p.rueckfragen.length} Rückfragen</div>
                  </div>
                  {isIntern && lastIn(p.rueckfragen) && <span className="chip" style={{ background: "#F3E7CE", color: "#8A5A00" }}>Rückfrage offen</span>}
                  <span className="pbetrag">{p.betrag}</span><AccChip p={p} /><span className="chev">›</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="note" style={{ fontStyle: "normal", marginBottom: 10 }}>Für diese Anfrage besteht noch kein Angebot mit Positionen. Kommunikation unten.</div>
      )}

      {isIntern && ord.internePlanung?.length > 0 && (
        <>
          <div className="sec">Interne Planung <span className="internbadge">nur intern</span></div>
          <div className="card" style={{ padding: "4px 20px" }}>
            <ul className="tl">
              {ord.internePlanung.map((t) => (
                <li className="tli" key={t.id}>
                  <span className="when">{t.datum}</span>
                  <div className="body">
                    <div className="tt">{t.titel}
                      <select className="statsel" value={t.status} onChange={(e) => setIPStatus(ord.id, t.id, e.target.value)}>{STATI.map((st) => <option key={st} value={st}>{st}</option>)}</select>
                    </div>
                    {t.info && <div className="ii">{t.info}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="sec">Allgemeine Kommunikation</div>
      {ord.emails.length === 0 && <div className="muted small" style={{ marginBottom: 10 }}>Noch keine allgemeinen Nachrichten.</div>}
      {ord.emails.map((m, i) => (
        <div className={"msg " + m.dir} key={i}>
          <div className="mh"><span>{m.dir === "in" ? "↓ Kunde · " + m.from : "↑ Wir · " + m.from}</span><span className="mono">{m.datum}</span></div>
          <div className="subj">{m.betreff}</div>
          <div className="body">{m.body}</div>
        </div>
      ))}
      <div className="composer2">
        <textarea placeholder={isIntern ? "Nachricht an den Kunden …" : "Nachricht zum Auftrag …"} value={draft} onChange={(e) => { setDraft(e.target.value); setSent(false); }} />
        <div className="actions"><button className="btn sm" onClick={send}>Senden</button>{sent && <span className="sent">✓ gesendet</span>}</div>
      </div>

      {openPos && <PositionSheet ord={ord} pos={openPos} onClose={() => setOpenPosId(null)} />}
    </>
  );
}
