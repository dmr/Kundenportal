import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { STAGES, STATI, stageIdx, suggestStage, threadOpen, PRIO_RANK, parseEUR, fmtEUR } from "../data/portal.js";
import { Status, Stepper, clickable, SichtBadge } from "../components/ui.jsx";
import PositionSheet from "../components/PositionSheet.jsx";
import Thread from "../components/Thread.jsx";
import NewThreadForm from "../components/NewThreadForm.jsx";

export default function OrderDetail() {
  const { ordId } = useParams();
  const { orderById, custOf, geraetById, isIntern, meCust, vTasks, sendThreadMsg, createThread, setThreadResolved, setThreadPriority, setThreadTitle, setIPStatus, setStage, acceptOffer, setOfferStatus } = useStore();
  const [openPosId, setOpenPosId] = useState(null);
  const [querying, setQuerying] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [newThread, setNewThread] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const ord = orderById(ordId);
  if (!ord) return <Navigate to={isIntern ? "/intern" : "/kunde"} replace />;
  if (!isIntern && ord.customerId !== meCust?.id) return <Navigate to="/kunde" replace />;

  const openPos = openPosId ? ord.angebot?.positionen.find((p) => p.id === openPosId) : null;
  const ci = stageIdx(ord.stage), s = STAGES[ci];
  const isLast = ci === STAGES.length - 1;
  const suggested = suggestStage(ord);
  const offer = ord.angebot;
  const total = offer ? offer.positionen.reduce((sum, p) => sum + parseEUR(p.betrag), 0) : 0;

  // Voraussichtliche Fertigstellung für den Kunden: spätester kundensichtbarer
  // Teilaufgaben-Termin, sonst Lieferschein-Datum.
  const taskDates = offer ? offer.positionen.flatMap((p) => vTasks(p).map((t) => t.faellig).filter(Boolean)) : [];
  const custDue = taskDates.length ? taskDates.slice().sort().at(-1) : (ord.lieferschein?.datum || null);

  const posThreads = (pid) => ord.threads.filter((t) => t.positionId === pid);
  const generalThreads = ord.threads.filter((t) => !t.positionId)
    .slice().sort((a, b) => (PRIO_RANK[a.prioritaet] - PRIO_RANK[b.prioritaet]) || (Number(threadOpen(b)) - Number(threadOpen(a))));
  const resolvedCount = generalThreads.filter((t) => t.geloest).length;
  const visibleThreads = showResolved ? generalThreads : generalThreads.filter((t) => !t.geloest);

  // Rückfrage zum Angebot: als eigener Thread + Angebot in „in Klärung" – kein „Ablehnen".
  const sendQuery = () => {
    if (!queryText.trim()) return;
    createThread(ord.id, { titel: "Rückfrage zum Angebot " + offer.nr, prioritaet: "normal", positionId: null }, queryText);
    setOfferStatus(ord.id, "in Klärung");
    setQuerying(false); setQueryText("");
  };

  return (
    <>
      <div className="ord-head">
        <span className={"tlwtag" + (ord.tlw ? "" : " none")}>{ord.tlw || "Anfrage"}</span>
        <div className="h1 serif" style={{ fontSize: 25 }}>{ord.titel}</div>
        <span className="typ">{ord.typ}{ord.auftragsNr ? " · " + ord.auftragsNr : ""}</span>
      </div>
      <div className="lede">{custOf(ord.customerId)?.name} · angelegt {ord.datum}</div>
      {ord.geraetId && (() => { const g = geraetById(ord.geraetId); return g ? (
        <div className="devline">🔧 Gerät: <b>{g.bezeichnung}</b> · SN <span className="mono">{g.seriennummer}</span></div>
      ) : null; })()}
      {isIntern && <div className="sichtlegende"><SichtBadge /> auch für den Kunden sichtbar · <SichtBadge intern /> nur intern</div>}

      {/* Status + Aussage „wir sind dran, liefern bis X" in einem Block */}
      <Stepper stage={ord.stage} />
      {isIntern ? (
        <div className="statusbox">
          <div className="big">Schritt {ci + 1} von 6 — {s.kunde}</div>
          <div className="sm">{isLast ? "Vorgang abgeschlossen." : "Nächster Schritt: " + STAGES[ci + 1].label}</div>
          {!offer && <div className="warnline">⚠ Noch <b>&nbsp;kein Angebot</b>.</div>}
          {offer && ci < stageIdx("auftrag") && <div className="warnline">⚠ Noch <b>&nbsp;kein Auftrag</b>.</div>}
          {ci >= stageIdx("auftrag") && ci < stageIdx("bestellung") && <div className="warnline">⚠ Auftrag bestätigt, aber noch <b>&nbsp;keine Bestellung</b>.</div>}
        </div>
      ) : (
        <div className="statusbox">
          <div className="big">{s.kunde}</div>
          {!offer && <div className="sm">Wir prüfen Ihre Anfrage und melden uns mit einem Angebot.</div>}
          {offer && !isLast && (custDue
            ? <div className="sm">Wir sind dran — voraussichtlich fertig bis <b>{custDue}</b>.</div>
            : <div className="sm">Wir sind dran und halten Sie hier auf dem Laufenden.</div>)}
          {isLast && <div className="sm">Abgeschlossen{ord.lieferschein ? " · geliefert " + ord.lieferschein.datum : ""}.</div>}
        </div>
      )}

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
          <SichtBadge intern />
          <span className="note" style={{ margin: 0 }}>Steuert den für den Kunden sichtbaren Fortschritt.</span>
        </div>
      )}

      {/* Nächste Aktion: Angebotsfreigabe (nur Kunde, nur wenn offen).
          Aktionen + Mehrwert (Leistungen unten) im Fokus, Preis nur klein dabei. */}
      {!isIntern && offer && offer.status === "offen" && (
        <div className="offerbox">
          <div className="subh" style={{ marginTop: 0 }}>Angebot {offer.nr} prüfen</div>
          <div className="muted small">{offer.positionen.length} Leistung(en) · vom {offer.datum} · Gesamt <span className="pbetrag">{fmtEUR(total)}</span></div>
          {!querying ? (
            <>
              <div className="offer-actions">
                <button className="btn" onClick={() => acceptOffer(ord.id)}>Angebot annehmen</button>
                <button className="btn ghost" onClick={() => setQuerying(true)}>Rückfrage stellen</button>
              </div>
              <div className="note" style={{ fontStyle: "normal" }}>Die einzelnen Leistungen sehen Sie unten. Annahme gilt fürs ganze Angebot.</div>
            </>
          ) : (
            <>
              <textarea className="reasonbox" placeholder="Ihre Rückfrage zum Angebot – z. B. Umfang, Termin, einzelne Leistung …" value={queryText} onChange={(e) => setQueryText(e.target.value)} />
              <div className="offer-actions">
                <button className="btn" onClick={sendQuery}>Rückfrage senden</button>
                <button className="btn ghost" onClick={() => setQuerying(false)}>Zurück</button>
              </div>
            </>
          )}
        </div>
      )}
      {!isIntern && offer && offer.status === "angenommen" && ci < stageIdx("auftrag") + 1 && (
        <div className="confirmbox ok">✓ Angebot angenommen — wir starten die Umsetzung. Den Fortschritt sehen Sie oben.</div>
      )}
      {!isIntern && offer && offer.status === "in Klärung" && (
        <div className="confirmbox clarify">Danke für Ihre Rückfrage — wir klären sie und stellen Ihnen anschließend ein aktualisiertes Angebot zur Freigabe.</div>
      )}

      {/* Team: Angebots-Status steuern — Ablehnung/Klärung führt zurück zur Freigabe. */}
      {isIntern && offer && (
        <div className="frm" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <span className="typ">Angebot:</span>
          <Status s={offer.status} />
          {offer.status === "offen" && <button className="btn ghost sm" onClick={() => setOfferStatus(ord.id, "in Klärung")}>Auf „in Klärung" setzen</button>}
          {offer.status === "in Klärung" && <button className="btn ghost sm" onClick={() => setOfferStatus(ord.id, "offen")}>Erneut zur Freigabe stellen</button>}
          <SichtBadge intern />
          <span className="note" style={{ margin: 0 }}>Steuert, was der Kunde zur Freigabe sieht.</span>
        </div>
      )}

      {/* Inhalt: Themen, an denen wir arbeiten. Doku-Karten nur intern, Preise dezent. */}
      {offer ? (
        <>
          {isIntern && (<>
            <div className="sec" style={{ marginTop: 4 }}>Belege <SichtBadge intern /></div>
            <div className="dual">
              <div className="sumcard">
                <div className="subh" style={{ margin: 0 }}>Angebot</div>
                <div className="sumnr mono">{offer.nr}</div>
                <Status s={offer.status} />
                <div className="sumtotal">{fmtEUR(total)} · vom {offer.datum}</div>
                <div className="accprog">{offer.positionen.filter((p) => p.angenommen).length} / {offer.positionen.length} Positionen angenommen</div>
              </div>
              <div className="sumcard">
                <div className="subh" style={{ margin: 0 }}>Bestellung</div>
                {ord.bestellung
                  ? <><div className="sumnr mono">{ord.bestellung.nr}</div><div className="summeta">vom {ord.bestellung.datum}</div><Status s={ord.bestellung.status} /></>
                  : <div className="summeta" style={{ marginTop: 10 }}>Noch keine Bestellung erfasst.</div>}
                {ord.lieferschein && <div className="summeta" style={{ marginTop: 12 }}>Lieferschein <span className="mono">{ord.lieferschein.nr}</span> · <Status s={ord.lieferschein.status} /></div>}
              </div>
            </div>
          </>)}

          <div className="sec" style={{ marginTop: 4 }}>{isIntern ? "Positionen" : "Daran arbeiten wir"} {isIntern && <SichtBadge />} <span className="note" style={{ margin: 0, fontStyle: "normal" }}>· antippen für Details</span></div>
          <div className="card">
            {offer.positionen.map((p) => {
              const done = vTasks(p).filter((t) => t.status === "erledigt").length, tot = vTasks(p).length;
              return (
                <div className="row" key={p.id} {...clickable(() => setOpenPosId(p.id))}>
                  <div className="grow">
                    <div className="name">{p.titel}</div>
                    <div className="meta">{tot > 0 ? done + "/" + tot + " Teilaufgaben erledigt" : "in Vorbereitung"}{posThreads(p.id).length ? " · " + posThreads(p.id).length + " Rückfragen" : ""}</div>
                  </div>
                  {isIntern && posThreads(p.id).some(threadOpen) && <span className="chip" style={{ background: "#F3E7CE", color: "#8A5A00" }}>Rückfrage offen</span>}
                  <span className="pbetrag">{p.betrag}</span><span className="chev">›</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        isIntern && <div className="note" style={{ fontStyle: "normal", marginBottom: 10 }}>Zu dieser Anfrage gibt es noch kein Angebot. Nach Prüfung Angebot mit Positionen erstellen.</div>
      )}

      {isIntern && ord.internePlanung?.length > 0 && (
        <>
          <div className="sec">Interne Planung <SichtBadge intern /></div>
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

      <div style={{ marginTop: 24 }}>
        <div className="sec" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {isIntern ? <>Kommunikation <SichtBadge /></> : <>Rückfragen & weitere Punkte
              <button className="help-btn" onClick={() => setShowHelp((v) => !v)} aria-label="Wie funktionieren Themen?" aria-expanded={showHelp}>?</button></>}
          </span>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {resolvedCount > 0 && <button className="linkbtn" onClick={() => setShowResolved((v) => !v)}>{showResolved ? "Gelöste ausblenden" : "Gelöste anzeigen (" + resolvedCount + ")"}</button>}
            {!newThread && <button className="btn ghost sm" onClick={() => setNewThread(true)}>+ Neues Thema</button>}
          </span>
        </div>
        {!isIntern && showHelp && (
          <div className="helpbox">
            <b>So funktionieren Themen</b>
            <ul>
              <li>Eröffnen Sie pro Anliegen ein eigenes <b>Thema</b> („+ Neues Thema") und geben Sie ihm einen Titel und eine Priorität.</li>
              <li>Schreiben Sie Nachrichten und hängen Sie <b>Bilder oder PDFs</b> an (📎). Wir antworten direkt im selben Thema.</li>
              <li>Mit <b>▸/▾</b> klappen Sie ein Thema ein und aus.</li>
              <li>Ist Ihr Anliegen geklärt, tippen Sie <b>„Als gelöst markieren"</b>. Eine neue Nachricht öffnet das Thema automatisch wieder.</li>
            </ul>
          </div>
        )}
        {!isIntern && <div className="muted small" style={{ marginBottom: 10 }}>Eröffnen Sie je Anliegen ein Thema, hängen Sie Screenshots/PDFs an und markieren Sie es als gelöst, wenn es passt.</div>}
        {newThread && <NewThreadForm onCancel={() => setNewThread(false)} onCreate={(d) => { createThread(ord.id, { ...d, positionId: null }, d.text); setNewThread(false); }} />}
        {visibleThreads.length === 0 && !newThread && <div className="card"><div className="empty">{generalThreads.length === 0 ? "Noch keine Themen — legen Sie über + Neues Thema eines an." : "Keine offenen Themen — alle erledigt."}</div></div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {visibleThreads.map((t) => (
            <Thread
              key={t.id}
              title={t.titel}
              messages={t.nachrichten}
              resolved={t.geloest}
              prioritaet={t.prioritaet}
              onPriority={(v) => setThreadPriority(ord.id, t.id, v)}
              onTitle={(v) => setThreadTitle(ord.id, t.id, v)}
              onToggleResolved={() => setThreadResolved(ord.id, t.id, !t.geloest)}
              onSend={(text, anh) => sendThreadMsg(ord.id, t.id, text, anh)}
              placeholder={isIntern ? "Antwort schreiben …" : "Nachricht schreiben …"}
            />
          ))}
        </div>
      </div>

      {openPos && <PositionSheet ord={ord} pos={openPos} onClose={() => setOpenPosId(null)} />}
    </>
  );
}
