import { useState } from "react";
import { useStore } from "../store.jsx";
import { clickable } from "../components/ui.jsx";
import DeviceSheet from "../components/DeviceSheet.jsx";

export default function Geraete() {
  const { meCust, geraeteOf, setNewAnfrage } = useStore();
  const [openId, setOpenId] = useState(null);
  const geraete = (meCust ? geraeteOf(meCust.id) : [])
    .slice()
    .sort((a, b) => (a.bezeichnung < b.bezeichnung ? -1 : 1));
  const open = geraete.find((g) => g.id === openId);

  return (
    <>
      <div className="h1 serif">Meine Geräte</div>
      <div className="lede">Ihre Geräte und ihr Verlauf — tippen Sie ein Gerät für alle Aufträge und Details.</div>

      <div className="card">
        {geraete.length === 0 && <div className="empty">Noch keine Geräte hinterlegt.</div>}
        {geraete.map((g) => (
          <div className="row" key={g.id} {...clickable(() => setOpenId(g.id))}>
            {g.bild && <img className="thumb thumb-lg" src={import.meta.env.BASE_URL + g.bild} alt="" loading="lazy" />}
            <div className="grow">
              <div className="name">{g.bezeichnung}</div>
              <div className="meta">{g.typ} · im Einsatz seit {g.ausgeliefert}</div>
            </div>
            <span className="chev">›</span>
          </div>
        ))}
      </div>

      <button className="btn" style={{ marginTop: 18 }} onClick={() => setNewAnfrage({ titel: "", typ: "Kalibrierung", text: "", geraetId: null })}>
        + Kalibrierung anfragen
      </button>

      {open && <DeviceSheet geraet={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
