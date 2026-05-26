import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import PinLock from "./components/PinLock";
import { ToastProvider } from "./components/UI";
import POSPage        from "./pages/POSPage";
import CashierPage    from "./pages/CashierPage";
import BuilderPage    from "./pages/BuilderPage";
import MembersPage    from "./pages/MembersPage";
import AnalyticsPage  from "./pages/AnalyticsPage";
import SettingsPage   from "./pages/SettingsPage";
import CustomerCardPage from "./pages/CustomerCardPage";

const NAV = [
  { to:"/", label:"POS",       icon:"🏪", end:true },
  { to:"/cashier",   label:"Cashier QR", icon:"📲" },
  { to:"/builder",   label:"Card Builder",icon:"🎨" },
  { to:"/members",   label:"Members",    icon:"👥" },
  { to:"/analytics", label:"Analytics",  icon:"📊" },
  { to:"/settings",  label:"Settings",   icon:"⚙️" },
];

function CashierApp() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gridTemplateRows:"54px 1fr", minHeight:"100vh" }}>
      {/* Topbar */}
      <div style={{ gridColumn:"1/-1", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", background:"#fff", borderBottom:"1px solid var(--border)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:28, height:28, background:"var(--accent)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:14 }}>✦</div>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700 }}>StampKit</span>
          <span style={{ fontSize:11, color:"var(--muted)", fontWeight:500, background:"var(--warm)", padding:"2px 8px", borderRadius:50, border:"1px solid var(--border)" }}>Demo Mode</span>
        </div>
        <button onClick={() => setUnlocked(false)} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid var(--border)", background:"transparent", color:"var(--muted)", fontSize:12, fontWeight:600, cursor:"pointer" }}>
          🔒 Lock
        </button>
      </div>

      {/* Sidebar */}
      <div style={{ background:"var(--warm)", borderRight:"1px solid var(--border)", padding:"14px 10px", display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} style={({ isActive }) => ({
            display:"flex", alignItems:"center", gap:9, padding:"9px 10px", borderRadius:9,
            fontSize:13, fontWeight:500, textDecoration:"none", transition:".12s",
            color: isActive ? "var(--text)" : "var(--muted)",
            background: isActive ? "#fff" : "transparent",
            boxShadow: isActive ? "0 1px 4px rgba(15,14,12,.06)" : "none",
            fontWeight: isActive ? 600 : 500,
          })}>
            <span style={{ fontSize:15, width:18, textAlign:"center" }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <div style={{ flex:1 }} />
        <div style={{ padding:"8px 10px", fontSize:11, color:"var(--muted)", borderTop:"1px solid var(--border)", marginTop:8, paddingTop:12 }}>
          <div style={{ fontWeight:600, marginBottom:2 }}>Customer card URL:</div>
          <a href="/card" target="_blank" style={{ color:"var(--accent)", wordBreak:"break-all", fontSize:10 }}>
            {window.location.origin}/card
          </a>
        </div>
      </div>

      {/* Main */}
      <div style={{ overflowY:"auto" }}>
        <Routes>
          <Route path="/"          element={<POSPage />} />
          <Route path="/cashier"   element={<CashierPage />} />
          <Route path="/builder"   element={<BuilderPage />} />
          <Route path="/members"   element={<MembersPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/card" element={<CustomerCardPage />} />
        <Route path="/*"    element={<CashierApp />} />
      </Routes>
    </BrowserRouter>
  );
}
