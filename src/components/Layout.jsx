import { useState } from "react";
import { Outlet, useLocation, useNavigate, matchPath, Navigate } from "react-router-dom";
import { useStore } from "../store.jsx";
import { calibStatus, today } from "../data/portal.js";
import NewAnfrageSheet from "./NewAnfrageSheet.jsx";

export default function Layout() {
  const { persp, isIntern, meCust, setPersp, handlungsbedarf, db, custOf, orderById, setNewAnfrage } = useStore();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState("");

  // Ohne gewählte Sichtweise zurück zur Login-/Auswahlseite.
  if (!persp) return <Navigate to="/" replace />;

  const go = (to) => nav(to);
  const switchView = () => { setPersp(null); nav("/"); };
  const submitSearch = (e) => { e.preventDefault(); const term = q.trim(); if (term) nav((isIntern ? "/intern" : "/kunde") + "/suche?q=" + encodeURIComponent(term)); };

  const overdue = db.geraete.filter((g) => calibStatus(g, today()) === "überfällig").length;

  const navItems = isIntern
    ? [
        { key: "home", label: "Übersicht", short: "Übersicht", active: pathname === "/intern", on: () => go("/intern") },
        { key: "customers", label: "Kunden", short: "Kunden", count: db.customers.length, active: pathname.startsWith("/intern/kunden"), on: () => go("/intern/kunden") },
        { key: "inbox", label: "Posteingang", short: "Post", badge: handlungsbedarf.length + (db.maileingang?.length || 0), active: pathname === "/intern/posteingang", on: () => go("/intern/posteingang") },
        { key: "calib", label: "Kalibrierung", short: "Kalib.", badge: overdue, active: pathname === "/intern/kalibrierung", on: () => go("/intern/kalibrierung") },
        { key: "prozess", label: "Prozess", short: "Prozess", active: pathname === "/intern/prozess", on: () => go("/intern/prozess") },
      ]
    : [
        { key: "home", label: "Meine Aufträge", short: "Aufträge", active: pathname === "/kunde", on: () => go("/kunde") },
        { key: "geraete", label: "Meine Geräte", short: "Geräte", active: pathname === "/kunde/geraete", on: () => go("/kunde/geraete") },
        { key: "prozess", label: "So läuft's ab", short: "Ablauf", active: pathname === "/kunde/prozess", on: () => go("/kunde/prozess") },
        { key: "new", label: "Neue Anfrage", short: "Neu", accent: true, on: () => setNewAnfrage({ titel: "", typ: "Kalibrierung", text: "", geraetId: null }) },
      ];

  // Breadcrumb aus der aktuellen Route ableiten.
  const homeTo = isIntern ? "/intern" : "/kunde";
  const mOrder = matchPath("/auftrag/:ordId", pathname);
  const mCust = matchPath("/intern/kunden/:custId", pathname);
  const ord = mOrder ? orderById(mOrder.params.ordId) : null;
  const crumbCust = mCust ? custOf(mCust.params.custId) : ord ? custOf(ord.customerId) : null;

  return (
    <div className="tlw-root">
      <div className="app">
        <header className="mtop">
          <span className="mbrand">Auftragsportal</span>
          <div className="mright">
            <span className={"tag " + (isIntern ? "intern" : "kunde")}>{isIntern ? "Intern" : meCust?.name}</span>
            <button className="mswitch" onClick={switchView} aria-label="Sicht wechseln">↺</button>
          </div>
        </header>

        <aside className="side">
          <div className="brand"><div className="mark">Auftragsportal</div></div>
          <div className="who">
            <span className={"tag " + (isIntern ? "intern" : "kunde")}>{isIntern ? "Intern · Team" : "Kundensicht"}</span>
            <div className="nm">{isIntern ? "Ihr Betrieb GmbH" : meCust?.name}</div>
          </div>
          <nav className="nav">
            {navItems.map((it) => it.accent
              ? <button key={it.key} className="new" onClick={it.on}>+ {it.label}</button>
              : <button key={it.key} className={it.active ? "active" : ""} onClick={it.on}>
                  <span>{it.label}</span>
                  {it.count != null && <span className="count">{it.count}</span>}
                  {it.badge > 0 && <span className="badge">{it.badge}</span>}
                </button>)}
          </nav>
          <div className="foot"><button onClick={switchView}>↺ Sicht wechseln</button></div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="crumb">
              <a onClick={() => go(homeTo)}>{isIntern ? "Übersicht" : "Meine Aufträge"}</a>
              {isIntern && crumbCust && <> {" / "} <a onClick={() => go("/intern/kunden/" + crumbCust.id)}>{crumbCust.name}</a></>}
              {ord && <> {" / "} <span className="cur">{ord.titel}</span></>}
              {pathname === "/intern/posteingang" && <> {" / "} <span className="cur">Posteingang</span></>}
              {pathname === "/intern/kalibrierung" && <> {" / "} <span className="cur">Kalibrierung</span></>}
              {pathname === "/intern/prozess" && <> {" / "} <span className="cur">Prozess</span></>}
              {pathname.endsWith("/suche") && <> {" / "} <span className="cur">Suche</span></>}
              {pathname === "/kunde/geraete" && <> {" / "} <span className="cur">Meine Geräte</span></>}
              {pathname === "/kunde/prozess" && <> {" / "} <span className="cur">So läuft's ab</span></>}
            </div>
            <form className="topsearch" onSubmit={submitSearch} role="search">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen …" aria-label="Suche" />
            </form>
          </div>

          <div className="content"><Outlet /></div>
        </main>

        <nav className="mbottom">
          {navItems.map((it) => (
            <button key={it.key} className={(it.active ? "on " : "") + (it.accent ? "accent" : "")} onClick={it.on}>
              <span className="ml">{it.accent ? "＋ " : ""}{it.short}</span>
              {it.badge > 0 && <span className="mbadge">{it.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      <NewAnfrageSheet />
    </div>
  );
}
