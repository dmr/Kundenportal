import { useState } from "react";
import { useStore } from "../store.jsx";
import { calibStatus, calibNextDue, today } from "../data/portal.js";
import { Status, clickable } from "../components/ui.jsx";
import DeviceSheet from "../components/DeviceSheet.jsx";

const GROUPS = ["überfällig", "fällig bald", "kalibriert"];

export default function Kalibrierung() {
  const { db, custOf } = useStore();
  const [openId, setOpenId] = useState(null);
  const td = today();
  const geraete = db.geraete
    .map((g) => ({ g, st: calibStatus(g, td), due: calibNextDue(g) }))
    .sort((a, b) => (a.due < b.due ? -1 : 1));
  const open = db.geraete.find((g) => g.id === openId);
  const count = (st) => geraete.filter((x) => x.st === st).length;

  return (
    <>
      <div className="h1 serif">Kalibrierung</div>
      <div className="lede">Fälligkeiten über alle Kunden – überfällige zuerst.</div>

      <div className="kpis">
        <div className={"kpi" + (count("überfällig") ? " alert" : "")}><div className="num">{count("überfällig")}</div><div className="k">Überfällig</div></div>
        <div className="kpi"><div className="num">{count("fällig bald")}</div><div className="k">Bald fällig</div></div>
        <div className="kpi"><div className="num">{db.geraete.length}</div><div className="k">Geräte gesamt</div></div>
      </div>

      {GROUPS.map((grp) => {
        const items = geraete.filter((x) => x.st === grp);
        if (items.length === 0) return null;
        return (
          <div key={grp}>
            <div className="sec">{grp === "überfällig" ? "Überfällig" : grp === "fällig bald" ? "Bald fällig" : "Aktuell kalibriert"}</div>
            <div className="card">
              {items.map(({ g, st, due }) => (
                <div className="row" key={g.id} {...clickable(() => setOpenId(g.id))}>
                  {g.bild && <img className="thumb" src={import.meta.env.BASE_URL + g.bild} alt="" loading="lazy" />}
                  <div className="grow">
                    <div className="name">{g.bezeichnung} <span className="typ">· {g.seriennummer}</span></div>
                    <div className="meta">{custOf(g.customerId)?.name} · fällig {due}</div>
                  </div>
                  <Status s={st} />
                  <span className="chev">›</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {open && <DeviceSheet geraet={open} onClose={() => setOpenId(null)} />}
    </>
  );
}
