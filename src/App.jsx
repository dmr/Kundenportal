import { Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import InternHome from "./pages/InternHome.jsx";
import Customers from "./pages/Customers.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import Inbox from "./pages/Inbox.jsx";
import Kalibrierung from "./pages/Kalibrierung.jsx";
import Prozess from "./pages/Prozess.jsx";
import KundeHome from "./pages/KundeHome.jsx";
import Geraete from "./pages/Geraete.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";

// Rollen-Guards: leiten auf die jeweils passende Startseite um.
function InternOnly({ children }) {
  const { isIntern } = useStore();
  return isIntern ? children : <Navigate to="/kunde" replace />;
}
function KundeOnly({ children }) {
  const { isIntern, persp } = useStore();
  return persp && !isIntern ? children : <Navigate to="/intern" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Layout prüft die Sichtweise; ohne Login → zurück zur Auswahl. */}
      <Route element={<Layout />}>
        <Route path="/intern" element={<InternOnly><InternHome /></InternOnly>} />
        <Route path="/intern/kunden" element={<InternOnly><Customers /></InternOnly>} />
        <Route path="/intern/kunden/:custId" element={<InternOnly><CustomerDetail /></InternOnly>} />
        <Route path="/intern/posteingang" element={<InternOnly><Inbox /></InternOnly>} />
        <Route path="/intern/kalibrierung" element={<InternOnly><Kalibrierung /></InternOnly>} />
        <Route path="/intern/prozess" element={<InternOnly><Prozess /></InternOnly>} />

        <Route path="/kunde" element={<KundeOnly><KundeHome /></KundeOnly>} />
        <Route path="/kunde/geraete" element={<KundeOnly><Geraete /></KundeOnly>} />
        <Route path="/kunde/prozess" element={<KundeOnly><Prozess /></KundeOnly>} />

        {/* Auftragsdetail für beide Rollen; Zugriffsschutz in der Seite selbst. */}
        <Route path="/auftrag/:ordId" element={<OrderDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
