import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, STATI, stageIdx, suggestStage, parseEUR, fmtEUR } from "../data/portal.js";
import { Status, Stepper, clickable } from "../components/ui.jsx";
import PositionSheet from "../components/PositionSheet.jsx";

export default function OrderDetail() {
  const { ordId } = useParams();
  const { orderById, custOf, isIntern, meCust, vTasks, lastIn, sendGen, setIPStatus, setStage, acceptOffer, rejectOffer, setOfferStatus } = useStore();
  const [openPosId, setOpenPosId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const ord = orderById(ordId);
  if (!ord) return <Navigate to={isIntern ? "/intern" : "/kunde"} replace />;
  if (!isIntern && ord.customerId !== meCust?.id) return <Navigate to="/kunde" replace />;

  const openPos = openPosId ? ord.angebot?.positionen.find((p) => p.id === openPosId) : null;
  const ci = stageIdx(ord.stage), s = STAGES[ci];
  const suggested = suggestStage(ord);
  const offer = ord.angebot;
  const total = offer ? offer.positionen.reduce((sum, p) => sum + parseEUR(p.betrag), 0) : 0;

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

      {/* 1) Status zuerst */}
      <Stepper stage={ord.stage} />
      <div className="statusbox">
        <div className="big">Schritt {ci + 1} von 6 — {s.kunde}</div>
        <div className="sm">{ci < STAGES.length - 1 ? "Nächster Schritt: " + STAGES[ci + 1].label : "Vorgang abgeschlossen."}</div>
        {!offer && <div className="warnline">⚠ Noch <b>&nbsp;kein Angebot</b> — wir prüfen Ihre Anfrage.</div>}
        {offer && ci < stageIdx("auftrag") && <div className="warnline">⚠ Noch <b>&nbsp;kein Auftrag</b>.</div>}
        {ci >= stageIdx("auftrag") && ci < stageIdx("bestellung") && <div className="warnline">⚠ Auftrag bestätigt, aber noch <b>&nbsp;keine Bestellung</b>.</div>}
      </div>

      {/* Team: Stage setzen + Hybrid-Vorschlag aus Teilaufgaben/Artefakten */}
      {isIntern && (
        <div className="frm" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <span className="typ">Status setzen:</span>
          <select value={ord.stage} onChange={(e) => setStage(ord.id, e.target.value)} style={{ flex: "0 0 auto", width: "auto" }}>
            {STAGES.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
          </select>
          {suggested !== ord.stage
            ? <button className="btn ghost sm" onClick={() => setStage(ord.id, suggested)}>Vorschlag übernehmen: {STAGES[stageIdx(suggested)].label}</button>
            : <span className="sent">✓ passt zum Stand</span>}
          <span className="note" style={{ margin: 0 }}>Vorschlag aus Teilaufgaben & Belegen – übersteuerbar.</span>
        </div>
      )}

      {/* 2) Nächste Aktion: Angebotsfreigabe (nur Kunde, nur wenn offen).
            Einziger Ort, an dem der Gesamtbetrag prominent zur Entscheidung steht. */}
      {!isIntern && offer && offer.status === "offen" && (
        <div className="offerbox">
          <div className="subh" style={{ marginTop: 0 }}>Angebot {offer.nr} prüfen</div>
          <div className="total">{fmtEUR(total)}</div>
          <div className="muted small" style={{ marginBottom: 14 }}>{offer.positionen.length} Position(en) · vom {offer.datum}</div>
          {!rejecting ? (
            <>
              <div className="offer-actions">
                <button className="btn" onClick={() => acceptOffer(ord.id)}>Angebot annehmen</button>
                <button className="btn ghost" onClick={() => setRejecting(true)}>Ablehnen</button>
              </div>
              <div className="note" style={{ fontStyle: "normal" }}>Einzelne Position unklar? Unten öffnen und eine Rückfrage stellen — Annahme gilt fürs ganze Angebot.</div>
            </>
          ) : (
            <>
              <textarea className="reasonbox" placeholder="Grund (optional) – z. B. Budget, Termin, Umfang" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="offer-actions">
                <button className="btn" onClick={() => { rejectOffer(ord.id, reason); setRejecting(false); setReason(""); }}>Ablehnung senden</button>
                <button className="btn ghost" onClick={() => setRejecting(false)}>Zurück</button>
              </div>
            </>
          )}
        </div>
      )}
      {!isIntern && offer && offer.status === "angenommen" && (
        <div className="confirmbox ok">✓ Angebot angenommen — wir starten die Umsetzung. Den Fortschritt sehen Sie oben.</div>
      )}
      {!isIntern && offer && offer.status === "in Klärung" && (
        <div className="confirmbox clarify">Wir klären Ihre Rückfrage und stellen Ihnen anschließend ein aktualisiertes Angebot zur Freigabe.</div>
      )}
      {!isIntern && offer && offer.status === "abgelehnt" && (
        <div className="confirmbox no">Angebot abgelehnt. Möchten Sie etwas anpassen? Schreiben Sie uns unten.</div>
      )}

      {/* Team: Angebots-Status steuern — Ablehnung/Klärung führt zurück zur Freigabe. */}
      {isIntern && offer && (
        <div className="frm" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <span className="typ">Angebot:</span>
          <Status s={offer.status} />
          {offer.status === "offen" && <button className="btn ghost sm" onClick={() => setOfferStatus(ord.id, "in Klärung")}>Auf „in Klärung" setzen</button>}
          {offer.status === "in Klärung" && <button className="btn ghost sm" onClick={() => setOfferStatus(ord.id, "offen")}>Erneut zur Freigabe stellen</button>}
          {offer.status === "abgelehnt" && <button className="btn ghost sm" onClick={() => setOfferStatus(ord.id, "offen")}>Überarbeitetes Angebot erneut stellen</button>}
          <span className="note" style={{ margin: 0 }}>Steuert, was der Kunde zur Freigabe sieht.</span>
        </div>
      )}

      {/* 3) Inhalt: Angebot/Bestellung & Positionen — Status führt, Preise dezent */}
      {offer ? (
        <>
          <div className="dual">
            <div className="sumcard">
              <div className="subh" style={{ margin: 0 }}>Angebot</div>
              <div className="sumnr mono">{offer.nr}</div>
              <Status s={offer.status} />
              <div className="sumtotal">{fmtEUR(total)} · vom {offer.datum}</div>
              <div className="accprog">{isIntern ? offer.positionen.filter((p) => p.angenommen).length + " / " + offer.positionen.length + " Positionen angenommen" : offer.positionen.length + " Position(en)"}</div>
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
            {offer.positionen.map((p) => {
              const done = vTasks(p).filter((t) => t.status === "erledigt").length, tot = vTasks(p).length;
              return (
                <div className="row" key={p.id} {...clickable(() => setOpenPosId(p.id))}>
                  <div className="grow">
                    <div className="name">{p.titel}</div>
                    <div className="meta">{tot > 0 ? done + "/" + tot + " Teilaufgaben erledigt" : "keine Teilaufgaben"} · {p.rueckfragen.length} Rückfragen</div>
                  </div>
                  {isIntern && lastIn(p.rueckfragen) && <span className="chip" style={{ background: "#F3E7CE", color: "#8A5A00" }}>Rückfrage offen</span>}
                  <span className="pbetrag">{p.betrag}</span><span className="chev">›</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="note" style={{ fontStyle: "normal", marginBottom: 10 }}>Zu dieser Anfrage gibt es noch kein Angebot. Sobald wir geprüft haben, erstellen wir ein Angebot mit Positionen — Sie sehen es hier.</div>
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

      <div className="sec">{isIntern ? "Allgemeine Kommunikation" : "Nachrichten & Rückfragen"}</div>
      {ord.emails.length === 0 && <div className="muted small" style={{ marginBottom: 10 }}>Noch keine Nachrichten.</div>}
      {ord.emails.map((m, i) => (
        <div className={"msg " + m.dir} key={i}>
          <div className="mh"><span>{m.dir === "in" ? "↓ Kunde · " + m.from : "↑ Wir · " + m.from}</span><span className="mono">{m.datum}</span></div>
          <div className="subj">{m.betreff}</div>
          <div className="body">{m.body}</div>
        </div>
      ))}
      <div className="composer2">
        <textarea placeholder={isIntern ? "Nachricht an den Kunden …" : "Nachricht oder Rückfrage zum Auftrag …"} value={draft} onChange={(e) => { setDraft(e.target.value); setSent(false); }} />
        <div className="actions"><button className="btn sm" onClick={send}>Senden</button>{sent && <span className="sent">✓ gesendet</span>}</div>
      </div>

      {openPos && <PositionSheet ord={ord} pos={openPos} onClose={() => setOpenPosId(null)} />}
    </>
  );
}
