import { useState, useEffect } from "react";
import { getConfig, getCustomer, createCustomer, addStamp, redeemReward, subscribeCustomer } from "../lib/db";
import { QRCodeCanvas as QRCode } from "qrcode.react";

function buildCardUrl(cardId) {
  const base = window.location.origin + window.location.pathname.split("?")[0];
  return `${base}?card=${cardId}`;
}

export default function CustomerCardPage() {
  const [step, setStep] = useState("loading"); // loading | join | card
  const [cfg, setCfg] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({ name:"", phone:"", email:"" });
  const [flash, setFlash] = useState(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    async function init() {
      const config = await getConfig();
      setCfg(config);

      // Check URL for card ID or stamp trigger
      const params = new URLSearchParams(window.location.search);
      const cardId  = params.get("card");
      const stamp   = params.get("stamp");

      if (cardId) {
        const c = await getCustomer(cardId);
        if (c) {
          setCustomer(c);
          setStep("card");
          if (stamp === cardId) {
            // Auto-stamp when cashier scans
            window.history.replaceState({}, "", window.location.pathname + "?card=" + cardId);
            setTimeout(() => triggerStamp(c, config), 500);
          }
        } else {
          setStep("join");
        }
      } else {
        // Check localStorage for returning customer
        const saved = localStorage.getItem("sk_my_card_id");
        if (saved) {
          const c = await getCustomer(saved);
          if (c) { setCustomer(c); setStep("card"); return; }
        }
        setStep("join");
      }
    }
    init();
  }, []);

  // Subscribe to live updates
  useEffect(() => {
    if (!customer) return;
    const unsub = subscribeCustomer(customer.cardId, updated => {
      setCustomer(updated);
    });
    return unsub;
  }, [customer?.cardId]);

  async function join() {
    if (!form.name.trim()) { alert("Please enter your name"); return; }
    if (!form.phone.trim() && !form.email.trim()) { alert("Please enter a phone or email"); return; }
    const c = await createCustomer(form);
    localStorage.setItem("sk_my_card_id", c.cardId);
    setCustomer(c);
    setStep("card");
  }

  async function triggerStamp(c, config) {
    const updated = await addStamp(c.cardId);
    setCustomer(updated);
    const reward = (config || cfg)?.rewards?.find(r => r.stamps === updated.stamps);
    setFlash({
      title: reward ? "🎁 Reward Earned!" : "✦ Stamp Added!",
      sub: reward ? `You earned: ${reward.name}!\nShow this to redeem.` : `${updated.stamps} of ${(config||cfg)?.goal} stamps collected`,
      bg: reward ? "var(--gold)" : "var(--green)",
      dark: !reward,
    });
  }

  if (step === "loading") return (
    <div style={{ minHeight:"100vh", background:"var(--ink)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20 }}>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, color:"var(--cream)" }}>StampKit</div>
      <div style={{ display:"flex", gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", animation:"ldot 1.2s ease-in-out infinite", animationDelay:`${i*0.2}s` }} />)}
      </div>
      <style>{`@keyframes ldot{0%,80%,100%{transform:scale(0.3);opacity:.3}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );

  if (step === "join") return (
    <div style={{ minHeight:"100vh", background:"var(--ink)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", alignItems:"center", gap:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }}>
          <div style={{ width:38, height:38, background:"var(--accent)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:20 }}>✦</div>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:22, color:"var(--cream)" }}>StampKit</span>
        </div>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:32, color:"var(--cream)", textAlign:"center", marginBottom:6 }}>{cfg?.biz}</div>
        <div style={{ fontSize:14, color:"rgba(250,247,242,.5)", marginBottom:32, textAlign:"center" }}>
          Join the loyalty program and start earning rewards
        </div>
        {[
          { key:"name",  label:"Your name",             type:"text",  ph:"Maria Santos" },
          { key:"phone", label:"Phone number",          type:"tel",   ph:"+31 6 1234 5678" },
          { key:"email", label:"Email (optional)",      type:"email", ph:"maria@example.com" },
        ].map(f => (
          <input key={f.key} type={f.type} placeholder={f.ph}
            value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            style={{ width:"100%", padding:"14px 16px", background:"rgba(255,255,255,.07)", border:"1.5px solid rgba(255,255,255,.12)", borderRadius:12, color:"var(--cream)", fontSize:16, outline:"none", marginBottom:10 }}
          />
        ))}
        <button onClick={join} style={{ width:"100%", padding:16, background:"var(--accent)", border:"none", borderRadius:12, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", marginTop:4, boxShadow:"0 4px 20px rgba(200,66,26,.4)" }}>
          Get my loyalty card →
        </button>
        <p style={{ fontSize:12, color:"rgba(250,247,242,.3)", textAlign:"center", marginTop:16, lineHeight:1.6 }}>
          Your card is saved in this browser.<br />Bookmark this page to always have it ready.
        </p>
      </div>
    </div>
  );

  // CARD SCREEN
  const goal  = cfg?.goal || 8;
  const pct   = goal > 0 ? Math.round(customer.stamps / goal * 100) : 0;
  const nxt   = (cfg?.rewards||[]).find(r => r.stamps > customer.stamps);
  const earned= (cfg?.rewards||[]).filter(r => r.stamps <= customer.stamps);
  const cardUrl = buildCardUrl(customer.cardId);
  const stampUrl = cardUrl + "&stamp=" + customer.cardId;

  return (
    <div style={{ minHeight:"100vh", background:"var(--cream)", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto" }}>

      {/* Hero */}
      <div style={{ background:cfg?.color||"var(--accent)", padding:"52px 24px 28px", position:"relative", overflow:"hidden", flexShrink:0 }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,rgba(0,0,0,.3) 0%,transparent 100%)" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:14, color:"rgba(255,255,255,.7)", fontFamily:"'DM Sans',sans-serif" }}>{cfg?.biz}</div>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, color:"#fff", fontWeight:700 }}>
            Hi {customer.name.split(" ")[0]}!
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{ margin:"0 16px", marginTop:-20, position:"relative", zIndex:2 }}>
        <div style={{ background:cfg?.color||"var(--accent)", borderRadius:20, padding:22, boxShadow:"0 12px 40px rgba(0,0,0,.2)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-25, right:-25, width:90, height:90, borderRadius:"50%", background:"rgba(255,255,255,.07)" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4, position:"relative", zIndex:1 }}>
            <div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, color:"#fff", fontWeight:700 }}>{cfg?.biz}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.5)" }}>{cfg?.tagline}</div>
            </div>
            <span style={{ fontSize:28 }}>☕</span>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", margin:"14px 0", position:"relative", zIndex:1 }}>
            {Array.from({length:goal}).map((_,i) => (
              <div key={i} style={{ width:26, height:26, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,.35)", background:i<customer.stamps?"rgba(255,255,255,.88)":"rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#333", transition:".3s" }}>
                {i < customer.stamps ? "✦" : ""}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", position:"relative", zIndex:1 }}>
            <div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:".8px" }}>{cfg?.ptsLabel}</div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, color:"#fff", lineHeight:1 }}>{customer.pts.toLocaleString()}</div>
            </div>
            {nxt && <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:".5px" }}>next reward</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.9)", fontWeight:600 }}>{nxt.name}</div>
            </div>}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ margin:"16px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--muted)", marginBottom:6 }}>
          <span>{customer.stamps} / {goal} stamps</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height:6, background:"rgba(0,0,0,.08)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:"linear-gradient(90deg,var(--accent),var(--gold))", borderRadius:3, transition:"width .6s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 80px" }}>

        {/* QR */}
        <div style={{ background:"#fff", border:"1.5px solid var(--border)", borderRadius:18, padding:24, textAlign:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, marginBottom:4 }}>Your Loyalty Card</div>
          <div style={{ fontSize:13, color:"var(--muted)", marginBottom:18, lineHeight:1.5 }}>Show this QR to the cashier after every purchase to collect your stamp</div>
          <div style={{ width:180, height:180, margin:"0 auto 14px", background:"#fff", borderRadius:14, padding:10, border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 12px rgba(0,0,0,.06)" }}>
            <QRCode value={stampUrl} size={160} bgColor="#fff" fgColor="#0f0e0c" level="M" />
          </div>
          <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"monospace", letterSpacing:1 }}>Card #{customer.cardId}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:"rgba(42,107,60,.08)", border:"1px solid rgba(42,107,60,.2)", borderRadius:10, padding:12, fontSize:13, color:"var(--green)", fontWeight:600, marginTop:14 }}>
            ⬛ Show this to the cashier to stamp
          </div>
        </div>

        {/* Rewards */}
        <div style={{ background:"#fff", border:"1.5px solid var(--border)", borderRadius:18, padding:20, marginBottom:14 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, marginBottom:14 }}>Your Rewards</div>
          {(cfg?.rewards||[]).map((r,i) => {
            const isEarned = customer.stamps >= r.stamps;
            const isNext   = !isEarned && (cfg.rewards.find(x=>x.stamps>customer.stamps)===r);
            const togo     = r.stamps - customer.stamps;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:12, background:isEarned?"rgba(42,107,60,.07)":isNext?"rgba(200,66,26,.06)":"var(--warm)", borderRadius:12, marginBottom:8, border:`1px solid ${isEarned?"rgba(42,107,60,.25)":isNext?"rgba(200,66,26,.2)":"var(--border)"}` }}>
                <span style={{ fontSize:22 }}>🎁</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>{r.name}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{r.desc}</div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:50, background:isEarned?"rgba(42,107,60,.12)":isNext?"rgba(200,66,26,.1)":"rgba(0,0,0,.05)", color:isEarned?"var(--green)":isNext?"var(--accent)":"var(--muted)", whiteSpace:"nowrap" }}>
                  {isEarned ? "Earned!" : isNext ? `${togo} to go` : `${r.stamps} stamps`}
                </span>
              </div>
            );
          })}
        </div>

        {/* History */}
        <div style={{ background:"#fff", border:"1.5px solid var(--border)", borderRadius:18, padding:20, marginBottom:14 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, marginBottom:14 }}>Activity</div>
          {!(customer.history?.length) && <div style={{ fontSize:13, color:"var(--muted)" }}>No activity yet</div>}
          {(customer.history||[]).slice().reverse().slice(0,8).map((h,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"8px 0", borderBottom:"1px solid var(--paper)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:h.type==="redeem"?"var(--gold)":h.type==="join"?"var(--accent)":"var(--green)", flexShrink:0 }} />
                <span style={{ fontWeight:500 }}>{h.label}</span>
              </div>
              <span style={{ color:"var(--muted)", fontSize:11 }}>{new Date(h.time).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ position:"sticky", bottom:0, background:"#fff", borderTop:"1px solid var(--border)", display:"flex", padding:"10px 8px", gap:4, zIndex:10, flexShrink:0 }}>
        <button style={{ flex:1, padding:8, borderRadius:10, border:"none", background:"rgba(200,66,26,.08)", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:"var(--accent)" }}>
          <span style={{ fontSize:20 }}>🏷️</span><span style={{ fontSize:10, fontWeight:600 }}>My Card</span>
        </button>
        <button onClick={() => setShowShare(true)} style={{ flex:1, padding:8, borderRadius:10, border:"none", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, color:"var(--muted)" }}>
          <span style={{ fontSize:20 }}>🔗</span><span style={{ fontSize:10, fontWeight:600 }}>Share Link</span>
        </button>
      </div>

      {/* Stamp flash */}
      {flash && (
        <div onClick={() => setFlash(null)} style={{ position:"fixed", inset:0, background:flash.bg+"f0", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:300, gap:12, cursor:"pointer" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, color:flash.dark?"#fff":"var(--ink)" }}>{flash.title}</div>
          <div style={{ fontSize:16, color:flash.dark?"rgba(255,255,255,.85)":"rgba(15,14,12,.7)", textAlign:"center", whiteSpace:"pre-line" }}>{flash.sub}</div>
          <div style={{ fontSize:13, color:flash.dark?"rgba(255,255,255,.5)":"rgba(15,14,12,.4)", marginTop:8 }}>Tap to continue</div>
        </div>
      )}

      {/* Share sheet */}
      {showShare && (
        <div onClick={e=>e.target===e.currentTarget&&setShowShare(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:200, display:"flex", alignItems:"flex-end" }}>
          <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:"24px 20px 32px", width:"100%", animation:"slideUp .25s ease" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, marginBottom:6 }}>Share your card link</div>
            <div style={{ fontSize:13, color:"var(--muted)", marginBottom:16 }}>Send this link to open your loyalty card on any device</div>
            <div style={{ background:"var(--warm)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 14px", fontFamily:"monospace", fontSize:12, marginBottom:14, wordBreak:"break-all" }}>{cardUrl}</div>
            <button onClick={() => { navigator.clipboard?.writeText(cardUrl); toast("Link copied!","ok"); setShowShare(false); }}
              style={{ width:"100%", padding:14, background:"var(--accent)", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10 }}>
              Copy link
            </button>
            {navigator.share && <button onClick={() => { navigator.share({ title:cfg?.biz+" Loyalty Card", url:cardUrl }); setShowShare(false); }}
              style={{ width:"100%", padding:14, background:"transparent", border:"1.5px solid var(--border)", borderRadius:12, color:"var(--text)", fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Share via...
            </button>}
          </div>
          <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        </div>
      )}
    </div>
  );
}
