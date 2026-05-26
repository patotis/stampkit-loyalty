import { useState, useEffect } from "react";
import { getConfig, saveConfig } from "../lib/db";
import { Card, CardHead, Field, Input, Btn, LoyaltyCardPreview, Chip, toast } from "../components/UI";

const COLORS = [
  { label:"Ember",  bg:"linear-gradient(135deg,#1a0a00,#c8421a,#d4a017)", swatch:"#c8421a" },
  { label:"Forest", bg:"linear-gradient(135deg,#071a10,#2a6b3c,#3de882)", swatch:"#2a6b3c" },
  { label:"Ocean",  bg:"linear-gradient(135deg,#0e0a2a,#2d1f6e,#4f9eff)", swatch:"#4f9eff" },
  { label:"Rose",   bg:"linear-gradient(135deg,#2a0515,#6b1a3a,#ff5f9e)", swatch:"#ff5f9e" },
  { label:"Slate",  bg:"linear-gradient(135deg,#0a0a0a,#1a1a1a,#3a3a3a)", swatch:"#555" },
  { label:"Violet", bg:"linear-gradient(135deg,#1a0530,#3d0d5e,#9b5de5)", swatch:"#9b5de5" },
  { label:"Teal",   bg:"linear-gradient(135deg,#001816,#003d3a,#0ad3c8)", swatch:"#0ad3c8" },
  { label:"Gold",   bg:"linear-gradient(135deg,#1e1400,#5a3e00,#f0c040)", swatch:"#d4a017" },
];

export default function BuilderPage() {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [demoStamps, setDemoStamps] = useState(3);

  useEffect(() => { getConfig().then(setCfg); }, []);

  function update(key, val) { setCfg(prev => ({ ...prev, [key]: val })); }

  function updateReward(idx, key, val) {
    const rewards = cfg.rewards.map((r, i) => i === idx ? { ...r, [key]: val } : r);
    setCfg(prev => ({ ...prev, rewards }));
  }
  function addReward() {
    const last = cfg.rewards[cfg.rewards.length - 1];
    const stamps = last ? last.stamps + cfg.goal : cfg.goal;
    setCfg(prev => ({ ...prev, rewards: [...prev.rewards, { id: Date.now().toString(), name:"New reward", desc:"Describe it", stamps }] }));
  }
  function removeReward(idx) {
    setCfg(prev => ({ ...prev, rewards: prev.rewards.filter((_, i) => i !== idx) }));
  }

  async function save() {
    setSaving(true);
    await saveConfig(cfg);
    setTimeout(() => setSaving(false), 800);
    toast("Card saved and applied!", "ok");
  }

  if (!cfg) return <div style={{ padding:40, color:"var(--muted)" }}>Loading…</div>;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, padding:20, alignItems:"start" }}>

      {/* LEFT: form */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Business info */}
        <Card>
          <CardHead title="Business Info" />
          <div style={{ padding:18, display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Business name" required>
                <Input value={cfg.biz} onChange={e => update("biz", e.target.value)} />
              </Field>
              <Field label="Tagline">
                <Input value={cfg.tagline || ""} onChange={e => update("tagline", e.target.value)} placeholder="Sip, earn, repeat." />
              </Field>
            </div>
            <Field label="Points label">
              <Input value={cfg.ptsLabel} onChange={e => update("ptsLabel", e.target.value)} style={{ maxWidth:160 }} />
            </Field>
          </div>
        </Card>

        {/* Card design */}
        <Card>
          <CardHead title="Card Design" />
          <div style={{ padding:18, display:"flex", flexDirection:"column", gap:16 }}>
            <Field label="Card color">
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:4 }}>
                {COLORS.map(c => (
                  <button key={c.label} onClick={() => update("color", c.bg)} title={c.label} style={{
                    width:30, height:30, borderRadius:"50%", cursor:"pointer",
                    background:`linear-gradient(135deg, ${c.swatch}, ${c.swatch}cc)`,
                    border: cfg.color === c.bg ? "3px solid var(--ink)" : "2px solid transparent",
                    transition:".12s", transform: cfg.color === c.bg ? "scale(1.15)" : undefined,
                    position:"relative",
                  }}>
                    {cfg.color === c.bg && <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", fontWeight:800 }}>✓</span>}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Stamp goal">
              <div style={{ display:"flex", gap:8 }}>
                {[5,6,8,10,12].map(n => (
                  <Chip key={n} active={cfg.goal===n} onClick={() => { update("goal", n); setDemoStamps(Math.min(demoStamps, n-1)); }}>
                    {n}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label={`Demo stamps: ${demoStamps}/${cfg.goal}`}>
              <input type="range" min={0} max={cfg.goal} value={demoStamps}
                onChange={e => setDemoStamps(+e.target.value)}
                style={{ accentColor:"var(--accent)", width:"100%", cursor:"pointer" }} />
            </Field>
          </div>
        </Card>

        {/* Rewards */}
        <Card>
          <CardHead title="Rewards & Milestones" action={
            <Btn size="sm" onClick={addReward}>+ Add</Btn>
          } />
          <div style={{ padding:18, display:"flex", flexDirection:"column", gap:10 }}>
            <p style={{ fontSize:12, color:"var(--muted)", marginBottom:4 }}>Define what customers earn at each stamp milestone. All editable.</p>
            {cfg.rewards.map((r, idx) => (
              <div key={r.id || idx} style={{ background:"var(--warm)", border:"1px solid var(--border)", borderRadius:12, padding:14, display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, alignItems:"start" }}>
                <Field label="Reward name">
                  <input value={r.name} onChange={e => updateReward(idx,"name",e.target.value)}
                    style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", fontSize:13, width:"100%", outline:"none" }} />
                </Field>
                <Field label="At stamp #">
                  <input type="number" value={r.stamps} min={1} max={200}
                    onChange={e => updateReward(idx,"stamps", parseInt(e.target.value)||1)}
                    style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", fontSize:13, width:"100%", outline:"none" }} />
                </Field>
                <button onClick={() => removeReward(idx)} style={{
                  marginTop:18, width:28, height:28, borderRadius:7, border:"1px solid var(--border)",
                  background:"transparent", color:"var(--muted)", cursor:"pointer", fontSize:13,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}
                onMouseEnter={e => { e.currentTarget.style.background="var(--accent)"; e.currentTarget.style.color="#fff"; e.currentTarget.style.borderColor="var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--muted)"; e.currentTarget.style.borderColor="var(--border)"; }}
                >✕</button>
                <div style={{ gridColumn:"1/-1" }}>
                  <input value={r.desc} onChange={e => updateReward(idx,"desc",e.target.value)}
                    placeholder="Short description"
                    style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:8, padding:"7px 10px", fontSize:13, width:"100%", outline:"none" }} />
                </div>
              </div>
            ))}
            <Btn full variant="ghost" style={{ borderStyle:"dashed", borderWidth:1.5, marginTop:4 }} onClick={addReward}>
              + Add reward milestone
            </Btn>
          </div>
        </Card>

        <Btn full variant="green" size="lg" onClick={save}>
          {saving ? "Saving…" : "Save & Apply to All Cards"}
        </Btn>
      </div>

      {/* RIGHT: preview */}
      <div style={{ position:"sticky", top:74, display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:"var(--muted)" }}>Live Preview</div>

        {/* Phone shell */}
        <div style={{ width:240, background:"#fff", borderRadius:36, padding:9, border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(15,14,12,.1)", margin:"0 auto" }}>
          <div style={{ background:"var(--ink)", borderRadius:28, overflow:"hidden", minHeight:480 }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"9px 14px 2px", fontSize:9, color:"rgba(255,255,255,.3)" }}>
              <span>9:41</span><span>5G ⊟</span>
            </div>
            <div style={{ padding:"6px 14px 10px" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, color:"#fff", fontWeight:700 }}>My Cards</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.35)" }}>Tap to view QR</div>
            </div>
            <div style={{ margin:"0 12px" }}>
              <LoyaltyCardPreview cfg={cfg} stamps={demoStamps} pts={demoStamps * 50} compact />
            </div>
            <div style={{ margin:"8px 12px 0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"rgba(255,255,255,.3)", marginBottom:4 }}>
                <span>Progress</span><span>{demoStamps}/{cfg.goal}</span>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,.06)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(demoStamps/cfg.goal*100)}%`, background:"linear-gradient(90deg,var(--accent),var(--gold))", borderRadius:2, transition:"width .4s" }} />
              </div>
            </div>
            {/* Rewards preview */}
            <div style={{ margin:"10px 12px", display:"flex", flexDirection:"column", gap:5 }}>
              {cfg.rewards.slice(0,3).map((r, i) => {
                const togo = r.stamps - demoStamps;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 8px", background:"rgba(255,255,255,.04)", borderRadius:9 }}>
                    <span style={{ fontSize:12 }}>🎁</span>
                    <span style={{ flex:1, fontSize:10, color:"rgba(255,255,255,.85)", fontFamily:"'DM Sans',sans-serif" }}>{r.name}</span>
                    <span style={{ fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:50, background: togo<=0 ? "rgba(42,107,60,.25)" : "rgba(200,66,26,.2)", color: togo<=0 ? "#6ee095" : "#f0a08a" }}>
                      {togo<=0 ? "Earned!" : `${togo} left`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
