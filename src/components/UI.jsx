import { useState, useEffect } from "react";

// ── BUTTON ──
export function Btn({ children, variant = "primary", size = "md", full, style, ...props }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 8, border: "none", fontWeight: 600, transition: "all .15s",
    width: full ? "100%" : undefined,
    borderRadius: size === "lg" ? 14 : 10,
    padding: size === "lg" ? "15px 24px" : size === "sm" ? "6px 12px" : "10px 18px",
    fontSize: size === "lg" ? 16 : size === "sm" ? 12 : 14,
    cursor: "pointer",
    ...style,
  };
  const variants = {
    primary: { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 12px rgba(200,66,26,.3)" },
    green:   { background: "var(--green)", color: "#fff", boxShadow: "0 2px 12px rgba(42,107,60,.25)" },
    dark:    { background: "var(--ink)", color: "#fff" },
    ghost:   { background: "transparent", border: "1.5px solid var(--border)", color: "var(--text)" },
    warm:    { background: "var(--warm)", border: "1px solid var(--border)", color: "var(--text)" },
    danger:  { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" },
  };
  return <button style={{ ...base, ...variants[variant] }} {...props}>{children}</button>;
}

// ── CARD ──
export function Card({ children, style, onClick, hover }) {
  return (
    <div onClick={onClick} style={{
      background: "#fff", border: "1.5px solid var(--border)",
      borderRadius: "var(--r-lg)", overflow: "hidden",
      boxShadow: "var(--shadow)",
      transition: hover ? "border-color .15s, box-shadow .15s" : undefined,
      cursor: onClick ? "pointer" : undefined,
      ...style,
    }}
    onMouseEnter={hover ? e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; } : undefined}
    onMouseLeave={hover ? e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow)"; } : undefined}
    >{children}</div>
  );
}

// ── CARD HEADER ──
export function CardHead({ title, action }) {
  return (
    <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--muted)" }}>{title}</div>
      {action}
    </div>
  );
}

// ── FIELD ──
export function Field({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "var(--muted)" }}>
        {label}{required && <span style={{ color: "var(--accent)" }}> *</span>}
      </label>}
      {children}
    </div>
  );
}

// ── INPUT ──
export function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return <input
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
    style={{
      background: "var(--warm)", border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--r)", color: "var(--text)", fontSize: 14,
      padding: "10px 13px", outline: "none", width: "100%",
      transition: "border-color .15s",
      ...style,
    }}
    {...props}
  />;
}

// ── SELECT ──
export function Select({ children, style, ...props }) {
  return <select style={{
    background: "var(--warm)", border: "1.5px solid var(--border)",
    borderRadius: "var(--r)", color: "var(--text)", fontSize: 14,
    padding: "10px 13px", outline: "none", width: "100%",
    ...style,
  }} {...props}>{children}</select>;
}

// ── BADGE ──
export function Badge({ children, color = "blue" }) {
  const colors = {
    blue:   { bg: "rgba(79,158,255,.12)",  text: "#2d6db5" },
    green:  { bg: "rgba(42,107,60,.1)",    text: "var(--green)" },
    gold:   { bg: "rgba(212,160,23,.12)",  text: "var(--gold)" },
    red:    { bg: "rgba(200,66,26,.1)",    text: "var(--accent)" },
    muted:  { bg: "rgba(0,0,0,.06)",       text: "var(--muted)" },
  };
  const c = colors[color] || colors.blue;
  return <span style={{ background: c.bg, color: c.text, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 50, display: "inline-flex", alignItems: "center", gap: 4 }}>{children}</span>;
}

// ── TOAST ──
let _setToast;
export function ToastProvider() {
  const [toast, setToast] = useState(null);
  _setToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };
  if (!toast) return null;
  const colors = { ok: "#7ee0a0", info: "var(--cream)", error: "#fca5a5" };
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: "var(--ink)", color: colors[toast.type] || "var(--cream)",
      borderRadius: 10, padding: "11px 20px", fontSize: 13, fontWeight: 500,
      zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 6px 24px rgba(0,0,0,.2)",
      animation: "toastIn .22s ease",
    }}>
      {toast.msg}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}
export const toast = (msg, type) => _setToast?.(msg, type);

// ── MODAL ──
export function Modal({ open, onClose, title, children, width = 520 }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose?.()} style={{
      position: "fixed", inset: 0, background: "rgba(15,14,12,.55)",
      backdropFilter: "blur(10px)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 28,
        maxWidth: width, width: "100%", maxHeight: "90vh", overflowY: "auto",
        position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,.15)",
        animation: "modalIn .2s ease",
      }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, width: 28, height: 28,
          borderRadius: "50%", background: "var(--warm)", border: "1px solid var(--border)",
          color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
        {title && <h2 style={{ fontSize: 22, marginBottom: 6 }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}

// ── CHIP ──
export function Chip({ children, active, onClick, style }) {
  return <button onClick={onClick} style={{
    padding: "5px 13px", borderRadius: 50,
    border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
    background: active ? "rgba(200,66,26,.07)" : "transparent",
    color: active ? "var(--accent)" : "var(--muted)",
    fontSize: 13, fontWeight: 500, transition: ".12s",
    ...style,
  }}>{children}</button>;
}

// ── LOYALTY CARD PREVIEW ──
export function LoyaltyCardPreview({ cfg, stamps = 0, pts = 0, memberName = "", compact }) {
  const goal = cfg?.goal || 8;
  const nxt  = (cfg?.rewards || []).find(r => r.stamps > stamps);
  return (
    <div style={{
      background: cfg?.color || "linear-gradient(135deg,#1a0a00,#c8421a,#d4a017)",
      borderRadius: compact ? 14 : 20, padding: compact ? 16 : 22,
      position: "relative", overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,.25)",
    }}>
      <div style={{ position: "absolute", top: -25, right: -25, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: compact ? 14 : 18, color: "#fff", fontWeight: 700 }}>{cfg?.biz || "Bloom Cafe"}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", marginTop: 1 }}>{cfg?.tagline || "Tap to stamp"}</div>
        </div>
        <div style={{ fontSize: compact ? 22 : 28 }}>☕</div>
      </div>
      <div style={{ display: "flex", gap: compact ? 4 : 6, flexWrap: "wrap", margin: `${compact ? 10 : 14}px 0`, position: "relative", zIndex: 1 }}>
        {Array.from({ length: goal }).map((_, i) => (
          <div key={i} style={{
            width: compact ? 18 : 24, height: compact ? 18 : 24, borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,.35)",
            background: i < stamps ? "rgba(255,255,255,.88)" : "rgba(255,255,255,.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: compact ? 8 : 10, color: "#333", transition: ".3s",
          }}>{i < stamps ? "✦" : ""}</div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".5px" }}>{cfg?.ptsLabel || "points"}</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: compact ? 18 : 26, color: "#fff", lineHeight: 1 }}>{pts.toLocaleString()}</div>
        </div>
        {nxt && <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".5px" }}>next reward</div>
          <div style={{ fontSize: compact ? 10 : 12, color: "rgba(255,255,255,.9)", fontWeight: 600 }}>{nxt.name}</div>
        </div>}
      </div>
      {memberName && <div style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,.5)", borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 8 }}>{memberName}</div>}
    </div>
  );
}
