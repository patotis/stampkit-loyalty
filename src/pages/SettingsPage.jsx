import { useState } from "react";
import { getPin, savePin } from "../lib/db";
import { Card, CardHead, Field, Input, Btn, toast } from "../components/UI";

export default function SettingsPage() {
  const [pin,    setPin]    = useState("");
  const [pinCfm, setPinCfm] = useState("");

  function updatePin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { toast("PIN must be 4 digits"); return; }
    if (pin !== pinCfm) { toast("PINs don't match"); return; }
    savePin(pin);
    toast("PIN updated", "ok");
    setPin(""); setPinCfm("");
  }

  return (
    <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16, maxWidth:600 }}>
      <Card>
        <CardHead title="Cashier PIN" />
        <div style={{ padding:18, display:"flex", flexDirection:"column", gap:14 }}>
          <p style={{ fontSize:13, color:"var(--muted)" }}>Change the 4-digit PIN used to unlock the cashier app. Current PIN: <strong style={{ fontFamily:"monospace" }}>{getPin()}</strong></p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="New PIN">
              <Input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="4 digits" />
            </Field>
            <Field label="Confirm PIN">
              <Input type="password" inputMode="numeric" maxLength={4} value={pinCfm} onChange={e => setPinCfm(e.target.value)} placeholder="Repeat PIN" />
            </Field>
          </div>
          <Btn variant="green" onClick={updatePin} style={{ alignSelf:"flex-start" }}>Update PIN</Btn>
        </div>
      </Card>

      <Card>
        <CardHead title="About" />
        <div style={{ padding:18, fontSize:13, color:"var(--muted)", display:"flex", flexDirection:"column", gap:8 }}>
          <div><strong style={{ color:"var(--text)" }}>StampKit</strong> — Digital loyalty card system</div>
          <div>Version 1.0 — Running in <strong>Demo Mode</strong> (localStorage)</div>
          <div style={{ marginTop:4 }}>
            <strong style={{ color:"var(--text)" }}>To go live with multi-device sync:</strong><br />
            Set up a free Firebase project at <a href="https://console.firebase.google.com" target="_blank" style={{ color:"var(--accent)" }}>console.firebase.google.com</a> and add your config to <code style={{ background:"var(--warm)", padding:"2px 6px", borderRadius:4, fontSize:12 }}>src/lib/db.js</code>
          </div>
        </div>
      </Card>
    </div>
  );
}
