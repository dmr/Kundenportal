import { useState } from "react";
import { useStore } from "../store.jsx";
import { calibStatus, calibNextDue, today } from "../data/portal.js";
import { Status, clickable } from "../components/ui.jsx";
import DeviceSheet from "../components/DeviceSheet.jsx";

export default function Geraete() {
  const { meCust, geraeteOf, setNewAnfrage } = useStore();
  const [openId, setOpenId] = useState(null);
  const td = today();
  const geraete = (meCust ? geraeteOf(meCust.id) : [])
    .slice()
    .sort((a, b) => (calibNextDue(a) < calibNextDue(b) ? -1 : 1));
  const open = geraete.find((g) => g.id === openId);
  const faellig = geraete.filter((g) => calibStatus(g, td) !== "kalibriert").length;

  return (
    <>
      <div className="h1 serif">Meine Geräte</div>
      <div className="lede">
        {geraete.length} Gerät(e){faellig > 0 ? " · " + faellig + " mit anstehender Kalibrierung" : " · alle aktuell"}.
      </div>

      <div className="card">
        {geraete.length === 0 && <div className="empty">Noch keine Geräte hinterlegt.</div>}
        {geraete.map((g) => {
          const st = calibStatus(g, td);
          return (
            <div className="row" key={g.id} {...clickable(() => setOpenId(g.id))}>
              <div className="grow">
                <div className="name">{g.bezeichnung}</div>
                <div className="meta">{g.hersteller} · SN {g.seriennummer} · nächste Kalibrierung {calibNextDue(g)}</div>
              </div>
              <Status s={st} />
              <span className="chev">›</span>
            </div>
          );
        })}
      </div>

      <button className="btn" style={{ marginTop: 18 }} onClick={() => setNewAnfrage({ titel: "", typ: "Kalibrierung", text: "", geraetId: null })}>
        + Kalibrierung anfragen
      </button>

      {open && <DeviceSheet geraet={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
