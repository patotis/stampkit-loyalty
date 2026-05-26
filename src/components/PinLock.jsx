import { useState } from "react";
import { checkPin } from "../lib/db";

export default function PinLock({ onUnlock }) {
  const [buf, setBuf] = useState("");
  const [shake, setShake] = useState(false);

  function press(d) {
    if (buf.length >= 4) return;
    const next = buf + d;
    setBuf(next);
    if (next.length === 4) {
      if (checkPin(next)) {
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => { setBuf(""); setShake(false); }, 700);
      }
    }
  }
  function del(all) { setBuf(all ? "" : buf.slice(0, -1)); }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--ink)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 28, zIndex: 500,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, background: "var(--accent)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>✦</div>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 26, color: "var(--cream)" }}>StampKit</span>
      </div>

      <div style={{ fontSize: 14, color: "rgba(250,247,242,.4)" }}>Cashier mode — enter PIN</div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 14, animation: shake ? "shake .4s ease" : undefined }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: "50%",
            border: "2px solid rgba(250,247,242,.2)",
            background: i < buf.length ? "var(--accent)" : "transparent",
            borderColor: i < buf.length ? "var(--accent)" : "rgba(250,247,242,.2)",
            transition: ".15s",
          }} />
        ))}
      </div>

      <div style={{ fontSize: 11, color: "rgba(250,247,242,.25)" }}>Default PIN: 1234</div>

      {/* Keypad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gridTemplateRows: "repeat(4, 64px)", gap: 10 }}>
        {[1,2,3,4,5,6,7,8,9,"⌫",0,"✕"].map((k, i) => (
          <button key={i} onClick={() => {
            if (k === "⌫") del(false);
            else if (k === "✕") del(true);
            else press(String(k));
          }} style={{
            background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.09)",
            borderRadius: 14, color: "var(--cream)",
            fontSize: typeof k === "number" ? 24 : 16,
            fontFamily: typeof k === "number" ? "'Fraunces',serif" : "'DM Sans',sans-serif",
            opacity: k === "⌫" || k === "✕" ? 0.5 : 1,
            transition: ".1s", cursor: "pointer",
          }}
          onMouseDown={e => e.currentTarget.style.background = "rgba(255,255,255,.18)"}
          onMouseUp={e => e.currentTarget.style.background = "rgba(255,255,255,.07)"}
          >{k}</button>
        ))}
      </div>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
    </div>
  );
}
