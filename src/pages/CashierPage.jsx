import { useState, useEffect, useRef } from "react";
import { getConfig, getCustomers, addStamp } from "../lib/db";
import { Card, CardHead, Btn, toast } from "../components/UI";
import { QRCodeCanvas as QRCode } from "qrcode.react";

export default function CashierPage() {
  const [cfg, setCfg] = useState(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [manualId, setManualId] = useState("");
  const [scanHistory, setScanHistory] = useState([]);
  const [camActive, setCamActive] = useState(false);
  const [flash, setFlash] = useState(null);
  const videoRef = useRef(null);
  const camRef = useRef(null);

  useEffect(() => {
    getConfig().then(c => {
      setCfg(c);
      const base = window.location.origin + window.location.pathname.replace(/\/$/, "").replace(/\/cashier/, "") + "/card";
      setJoinUrl(c.joinUrl || base);
    });
  }, []);

  async function processManualStamp() {
    const raw = manualId.trim();
    if (!raw) { toast("Enter a card ID or name"); return; }

    // Parse URL format
    let cardId = raw;
    try {
      if (raw.startsWith("http") || raw.includes("?")) {
        const u = new URL(raw.startsWith("http") ? raw : "https://x.com/" + raw);
        cardId = u.searchParams.get("stamp") || u.searchParams.get("card") || raw;
      }
    } catch {}

    // Find customer
    const all = await getCustomers();
    const cust = all.find(c => c.cardId === cardId || c.name.toLowerCase().includes(cardId.toLowerCase()));

    if (cust) {
      const updated = await addStamp(cust.cardId);
      const reward  = cfg?.rewards?.find(r => r.stamps === updated?.stamps);
      addToScanHistory(cust.name, reward ? `🎁 ${reward.name} earned!` : `+1 stamp (${updated?.stamps}/${cfg?.goal})`);
      showFlash(reward ? "🎁 Reward Earned!" : "✦ Stamped!", cust.name, reward ? "var(--gold)" : "var(--green)");
      toast(`Stamped ${cust.name}`, "ok");
    } else {
      addToScanHistory(cardId, "+1 stamp (unknown card)");
      showFlash("✦ Stamped!", `Card ${cardId}`, "var(--green)");
      toast("Stamped card " + cardId, "ok");
    }
    setManualId("");
  }

  function showFlash(title, sub, bg) {
    setFlash({ title, sub, bg });
    setTimeout(() => setFlash(null), 1800);
  }

  function addToScanHistory(name, action) {
    setScanHistory(prev => [{ name, action, time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) }, ...prev.slice(0, 9)]);
  }

  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:"environment" } });
      videoRef.current.srcObject = stream;
      camRef.current = stream;
      setCamActive(true);
      toast("Camera active — point at customer QR", "ok");
    } catch { toast("Camera unavailable"); }
  }

  function stopCam() {
    if (camRef.current) { camRef.current.getTracks().forEach(t => t.stop()); camRef.current = null; }
    setCamActive(false);
  }

  function printQR() {
    const w = window.open("","_blank");
    const canvas = document.querySelector("#join-qr-box canvas");
    const img = canvas ? canvas.toDataURL() : "";
    w.document.write(`<!DOCTYPE html><html><body style='display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:Georgia,serif'><div style='text-align:center'><img src='${img}' style='width:240px;height:240px;border-radius:12px'><h2 style='margin-top:14px'>${cfg?.biz || "StampKit"}</h2><p style='color:#888;margin-top:6px'>Scan to join our loyalty program</p></div></body></html>`);
    setTimeout(() => w.print(), 400);
  }

  return (
    <div style={{ padding:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>

      {/* Join QR */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <Card>
          <CardHead title="Customer Join QR" />
          <div style={{ padding:24, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20 }}>{cfg?.biz}</div>
            <p style={{ fontSize:13, color:"var(--muted)", maxWidth:280, lineHeight:1.6 }}>
              Show this to new customers. They scan once → enter name → card appears in their browser instantly. No app needed.
            </p>
            <div id="join-qr-box" style={{ background:"#fff", borderRadius:14, padding:14, border:"1px solid var(--border)", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
              {joinUrl && <QRCode value={joinUrl} size={180} bgColor="#fff" fgColor="#0f0e0c" level="M" />}
            </div>
            <div style={{ fontFamily:"monospace", fontSize:11, color:"var(--muted)", wordBreak:"break-all", maxWidth:280, textAlign:"center" }}>{joinUrl}</div>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="ghost" onClick={printQR}>🖨️ Print</Btn>
              <Btn variant="green" onClick={() => {
                const canvas = document.querySelector("#join-qr-box canvas");
                if (canvas) { const a=document.createElement("a"); a.href=canvas.toDataURL(); a.download="join-qr.png"; a.click(); toast("Downloaded","ok"); }
              }}>⬇ Download</Btn>
            </div>
          </div>
        </Card>

        {/* Join URL config */}
        <Card>
          <CardHead title="Join URL" />
          <div style={{ padding:16, display:"flex", gap:10 }}>
            <input value={joinUrl} onChange={e => setJoinUrl(e.target.value)}
              style={{ flex:1, padding:"9px 12px", background:"var(--warm)", border:"1px solid var(--border)", borderRadius:9, fontSize:13, outline:"none" }} />
            <Btn onClick={() => toast("URL updated", "ok")}>Update QR</Btn>
          </div>
          <p style={{ fontSize:12, color:"var(--muted)", padding:"0 16px 14px" }}>
            Set this to your deployed customer card URL. The QR will encode this address.
          </p>
        </Card>

        {/* Sign-up page preview */}
        <Card>
          <CardHead title="What Customers See" />
          <div style={{ padding:16 }}>
            <div style={{ background:"var(--warm)", borderRadius:12, padding:20, maxWidth:340 }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, marginBottom:4 }}>{cfg?.biz}</div>
              <div style={{ fontSize:13, color:"var(--muted)", marginBottom:16 }}>Join the loyalty program. Start earning today.</div>
              {["Your name","Phone number","Email (optional)"].map(ph => (
                <input key={ph} placeholder={ph} readOnly style={{ width:"100%", padding:"10px 12px", background:"#fff", border:"1px solid var(--border)", borderRadius:8, fontSize:14, marginBottom:8, color:"var(--muted)" }} />
              ))}
              <Btn full variant="green">Get my loyalty card →</Btn>
            </div>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:10 }}>
              After submitting, customers see their personal card with a unique QR code to show you.
            </p>
          </div>
        </Card>
      </div>

      {/* Scan to stamp */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <Card>
          <CardHead title="Scan Customer Card to Stamp" />
          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>
            <p style={{ fontSize:13, color:"var(--muted)" }}>
              Customer shows their card QR — scan it or enter their card ID to add a stamp.
            </p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <Btn onClick={camActive ? stopCam : startCam} variant={camActive ? "danger" : "primary"}>
                {camActive ? "Stop Camera" : "📷 Open Camera"}
              </Btn>
              <input value={manualId} onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && processManualStamp()}
                placeholder="Or type card ID / name / URL…"
                style={{ flex:1, minWidth:160, padding:"10px 12px", background:"var(--warm)", border:"1px solid var(--border)", borderRadius:9, fontSize:13, outline:"none" }} />
              <Btn variant="green" onClick={processManualStamp}>Stamp ✦</Btn>
            </div>
            {camActive && (
              <div style={{ textAlign:"center" }}>
                <video ref={videoRef} autoPlay playsInline style={{ width:"100%", maxWidth:380, borderRadius:12, background:"#000" }} />
                <p style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>Point camera at customer's card QR</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="Recent Scans" />
          <div style={{ padding:16 }}>
            {scanHistory.length === 0
              ? <div style={{ fontSize:13, color:"var(--muted)" }}>No scans yet this session</div>
              : scanHistory.map((h, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid var(--paper)", fontSize:13 }}>
                  <span style={{ fontWeight:600 }}>{h.name}</span>
                  <span style={{ color:"var(--green)", fontWeight:500 }}>{h.action}</span>
                  <span style={{ color:"var(--muted)", fontSize:11 }}>{h.time}</span>
                </div>
              ))
            }
          </div>
        </Card>
      </div>

      {/* Stamp flash */}
      {flash && (
        <div style={{
          position:"fixed", inset:0, background:flash.bg + "f0",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          zIndex:500, gap:10, animation:"fadeIn .25s ease",
        }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:38, color:flash.bg===("var(--gold)") ? "var(--ink)" : "#fff" }}>{flash.title}</div>
          <div style={{ fontSize:18, color:flash.bg===("var(--gold)") ? "rgba(15,14,12,.7)" : "rgba(255,255,255,.85)" }}>{flash.sub}</div>
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}
    </div>
  );
}
