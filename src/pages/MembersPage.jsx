import { useState, useEffect } from "react";
import { getCustomers, addStamp, redeemReward, getConfig, importCustomers } from "../lib/db";
import { Card, CardHead, Btn, Badge, Field, Input, Modal, toast } from "../components/UI";
import { LoyaltyCardPreview } from "../components/UI";

export default function MembersPage() {
  const [customers, setCustomers] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importRows, setImportRows] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [colMap, setColMap] = useState({});
  const [previewData, setPreviewData] = useState([]);

  useEffect(() => {
    getConfig().then(setCfg);
    getCustomers().then(setCustomers);
    const h = () => getCustomers().then(setCustomers);
    window.addEventListener("sk_update", h);
    return () => window.removeEventListener("sk_update", h);
  }, []);

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").includes(search) || (c.phone || "").includes(search) ||
    c.cardId.includes(search.toUpperCase())
  );

  async function stamp(c) {
    const updated = await addStamp(c.cardId);
    setCustomers(prev => prev.map(x => x.cardId === c.cardId ? { ...x, stamps: updated.stamps, pts: updated.pts } : x));
    if (selected?.cardId === c.cardId) setSelected({ ...selected, stamps: updated.stamps, pts: updated.pts });
    toast(`+1 stamp for ${c.name}`, "ok");
  }

  async function redeem(c, reward) {
    const updated = await redeemReward(c.cardId, reward);
    setCustomers(prev => prev.map(x => x.cardId === c.cardId ? { ...x, stamps: updated.stamps } : x));
    if (selected?.cardId === c.cardId) setSelected({ ...selected, stamps: updated.stamps });
    toast(`Redeemed: ${reward.name}`, "ok");
  }

  // ── IMPORT ──
  function handleFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".txt")) {
      const r = new FileReader();
      r.onload = e => parseCSV(e.target.result);
      r.readAsText(file);
    } else {
      toast("Please use CSV or Excel (.csv, .txt)");
    }
  }

  function parseCSV(text) {
    const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").trim().split("\n");
    if (lines.length < 2) { toast("File appears empty"); return; }
    const delim = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
    const parse = line => {
      const res=[]; let cur="", inQ=false;
      for (const ch of line) {
        if (ch==='"') inQ=!inQ;
        else if (ch===delim&&!inQ) { res.push(cur.trim()); cur=""; }
        else cur+=ch;
      }
      res.push(cur.trim()); return res;
    };
    const headers = parse(lines[0]);
    const rows = lines.slice(1).filter(l=>l.trim()).map(parse);
    setImportHeaders(headers);
    setImportRows(rows);
    const ALIASES = {
      name:   ["name","full name","customer name","first name","firstname"],
      email:  ["email","e-mail","email address","mail"],
      phone:  ["phone","mobile","tel","telephone","cell"],
      stamps: ["stamps","stamp","punches","visits","count"],
      pts:    ["points","pts","loyalty points","balance"],
    };
    const lower = headers.map(h=>h.toLowerCase().trim());
    const map = {};
    Object.entries(ALIASES).forEach(([k,al]) => {
      const match = al.find(a=>lower.includes(a));
      if (match) map[k] = headers[lower.indexOf(match)];
    });
    setColMap(map);
    setImportStep(2);
  }

  function buildPreview() {
    if (!colMap.name || colMap.name === "(skip)") { toast("Map the Name column"); return; }
    const getCol = (row, field) => {
      const col = colMap[field]; if (!col||col==="(skip)") return "";
      const i = importHeaders.indexOf(col);
      return i>=0 ? String(row[i]||"").trim() : "";
    };
    const data = importRows.slice(0,200).map(row => ({
      name: getCol(row,"name"), email: getCol(row,"email"), phone: getCol(row,"phone"),
      stamps: parseInt(getCol(row,"stamps"))||0, pts: parseInt(getCol(row,"pts"))||0,
    })).filter(r=>r.name);
    setPreviewData(data);
    setImportStep(3);
  }

  async function confirmImport() {
    const result = await importCustomers(previewData);
    const all = await getCustomers();
    setCustomers(all);
    setImportStep(4);
    toast(`Imported: ${result.added} new, ${result.updated} updated`, "ok");
  }

  function dlTemplate(type) {
    const rows = ["Name,Email,Phone,Stamps,Points","Maria Santos,maria@example.com,+31612345678,3,150","James Kim,james@example.com,,0,0"];
    let csv = rows.join("\n");
    if (type === "excel") csv = "\uFEFF" + csv;
    const blob = new Blob([csv], { type: type==="csv"?"text/csv":"application/vnd.ms-excel" });
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download = `stampkit_template.${type==="csv"?"csv":"xls"}`; a.click();
    URL.revokeObjectURL(a.href);
  }

  function resetImport() { setImportStep(1); setImportRows([]); setImportHeaders([]); setColMap({}); setPreviewData([]); }

  const statusColor = c => {
    const pct = cfg ? c.stamps / cfg.goal : 0;
    if (pct >= 1) return { bg:"rgba(212,160,23,.1)", text:"var(--gold)", label:"Reward!" };
    if (pct >= 0.5) return { bg:"rgba(42,107,60,.08)", text:"var(--green)", label:"Active" };
    return { bg:"rgba(0,0,0,.04)", text:"var(--muted)", label:"New" };
  };

  return (
    <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>

      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, phone, card ID…"
          style={{ flex:1, padding:"10px 14px", background:"#fff", border:"1.5px solid var(--border)", borderRadius:10, fontSize:14, outline:"none" }} />
        <Badge color="green">{customers.length} members</Badge>
        <Btn onClick={() => { setShowImport(true); resetImport(); }}>⬆ Import CSV</Btn>
      </div>

      <Card>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["Name","Card ID","Stamps","Points","Joined","Status",""].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"10px 14px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".4px", color:"var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign:"center", padding:"40px 20px", color:"var(--muted)" }}>
                  {search ? "No customers found" : "No customers yet — import a CSV or have customers sign up via the Join QR"}
                </td></tr>
              )}
              {filtered.map(c => {
                const s = statusColor(c);
                return (
                  <tr key={c.cardId}
                    onClick={() => setSelected(c)}
                    style={{ borderBottom:"1px solid rgba(0,0,0,.04)", cursor:"pointer", transition:".1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--warm)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  >
                    <td style={{ padding:"11px 14px", fontWeight:600 }}>{c.name}</td>
                    <td style={{ padding:"11px 14px", fontFamily:"monospace", fontSize:11, color:"var(--muted)" }}>{c.cardId}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ flex:1, maxWidth:80, height:4, background:"rgba(0,0,0,.06)", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min(cfg?c.stamps/cfg.goal*100:0,100)}%`, background:"var(--accent)", borderRadius:2 }} />
                        </div>
                        <span style={{ fontWeight:600 }}>{c.stamps}/{cfg?.goal}</span>
                      </div>
                    </td>
                    <td style={{ padding:"11px 14px" }}>{c.pts.toLocaleString()}</td>
                    <td style={{ padding:"11px 14px", color:"var(--muted)" }}>{c.joined ? new Date(c.joined).toLocaleDateString() : "—"}</td>
                    <td style={{ padding:"11px 14px" }}>
                      <span style={{ background:s.bg, color:s.text, fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:50 }}>{s.label}</span>
                    </td>
                    <td style={{ padding:"11px 14px" }}>
                      <Btn size="sm" variant="green" onClick={e=>{e.stopPropagation();stamp(c);}}>+Stamp</Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} width={480}>
        {selected && cfg && <>
          <p style={{ fontSize:13, color:"var(--muted)", marginBottom:20 }}>
            Card #{selected.cardId} · {selected.email || selected.phone || "No contact info"}
          </p>
          <LoyaltyCardPreview cfg={cfg} stamps={selected.stamps} pts={selected.pts} memberName={selected.name} compact />
          <div style={{ marginTop:16, display:"flex", gap:10 }}>
            <Btn full variant="green" onClick={()=>stamp(selected)}>✦ Add Stamp</Btn>
            {cfg.rewards.filter(r=>r.stamps<=selected.stamps).map(r => (
              <Btn key={r.id} full variant="warm" onClick={()=>redeem(selected,r)}>🎁 Redeem {r.name}</Btn>
            ))}
          </div>
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", color:"var(--muted)", marginBottom:10 }}>Activity</div>
            {(selected.history||[]).slice().reverse().slice(0,6).map((h,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"8px 0", borderBottom:"1px solid var(--paper)" }}>
                <span style={{ fontWeight:500 }}>{h.label}</span>
                <span style={{ color:"var(--muted)", fontSize:11 }}>{new Date(h.time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>}
      </Modal>

      {/* Import modal */}
      <Modal open={showImport} onClose={() => { setShowImport(false); resetImport(); }} title="Import Customers">
        {/* Steps */}
        <div style={{ display:"flex", marginBottom:20 }}>
          {["Upload","Map","Preview","Done"].map((s,i) => (
            <div key={s} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, fontSize:11, color: i+1<=importStep ? "var(--accent)" : "var(--muted)", position:"relative" }}>
              {i < 3 && <div style={{ position:"absolute", top:14, left:"calc(50% + 14px)", right:"calc(-50% + 14px)", height:1.5, background:"var(--border)" }} />}
              <div style={{ width:28, height:28, borderRadius:"50%", background: i+1<importStep?"var(--green)":i+1===importStep?"var(--accent)":"var(--warm)", border:`1.5px solid ${i+1<=importStep?"var(--accent)":"var(--border)"}`, color: i+1<=importStep?"#fff":"var(--muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, zIndex:1 }}>
                {i+1 < importStep ? "✓" : i+1}
              </div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {importStep === 1 && <>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <Btn size="sm" variant="ghost" onClick={()=>dlTemplate("csv")}>⬇ CSV template</Btn>
            <Btn size="sm" variant="ghost" onClick={()=>dlTemplate("excel")}>⬇ Excel template</Btn>
          </div>
          <div
            onClick={() => document.getElementById("file-upload").click()}
            onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="var(--accent)";}}
            onDragLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
            onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="var(--border)";handleFile(e.dataTransfer.files[0]);}}
            style={{ border:"2px dashed var(--border)", borderRadius:14, padding:32, textAlign:"center", cursor:"pointer", transition:".2s", background:"var(--warm)" }}
          >
            <div style={{ fontSize:36, marginBottom:8 }}>📂</div>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:3 }}>Drop your file here</div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>or <span style={{ color:"var(--accent)", textDecoration:"underline" }}>browse to upload</span></div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:6 }}>Supports .csv · .txt (tab or semicolon delimited)</div>
          </div>
          <input id="file-upload" type="file" accept=".csv,.txt" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
        </>}

        {importStep === 2 && <>
          <p style={{ fontSize:13, color:"var(--muted)", marginBottom:14 }}>Map your columns to StampKit fields. We've auto-detected where we can.</p>
          {[{key:"name",label:"Full Name",req:true},{key:"email",label:"Email"},{key:"phone",label:"Phone"},{key:"stamps",label:"Stamps"},{key:"pts",label:"Points"}].map(f => (
            <div key={f.key} style={{ display:"grid", gridTemplateColumns:"1fr 20px 1fr", gap:8, alignItems:"center", marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{f.label}{f.req&&<span style={{color:"var(--accent)"}}>*</span>}</div>
              <div style={{ color:"var(--muted)", textAlign:"center" }}>→</div>
              <select value={colMap[f.key]||"(skip)"} onChange={e=>setColMap(m=>({...m,[f.key]:e.target.value}))}
                style={{ background:"var(--warm)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 9px", fontSize:13, outline:"none" }}>
                <option value="(skip)">(skip)</option>
                {importHeaders.map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <Btn variant="ghost" onClick={()=>setImportStep(1)}>← Back</Btn>
            <Btn full variant="green" onClick={buildPreview}>Preview →</Btn>
          </div>
        </>}

        {importStep === 3 && <>
          <div style={{ background:"rgba(42,107,60,.08)", border:"1px solid rgba(42,107,60,.2)", borderRadius:11, padding:"13px 16px", display:"flex", gap:11, marginBottom:14 }}>
            <span style={{ fontSize:18 }}>✓</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}>{previewData.length} customers ready</div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{previewData.filter(r=>r.email&&customers.find(c=>c.email===r.email)).length} will update existing records</div>
            </div>
          </div>
          <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:10, marginBottom:14 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ background:"var(--warm)" }}>
                {["Name","Email","Stamps","Points"].map(h=><th key={h} style={{ textAlign:"left", padding:"8px 11px", fontWeight:700, textTransform:"uppercase", fontSize:10, letterSpacing:".4px", color:"var(--muted)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {previewData.slice(0,5).map((r,i)=>(
                  <tr key={i} style={{ borderTop:"1px solid var(--paper)" }}>
                    <td style={{ padding:"8px 11px", fontWeight:600 }}>{r.name}</td>
                    <td style={{ padding:"8px 11px", color:"var(--muted)" }}>{r.email||"—"}</td>
                    <td style={{ padding:"8px 11px" }}>{r.stamps}</td>
                    <td style={{ padding:"8px 11px" }}>{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 5 && <p style={{ fontSize:12, color:"var(--muted)", marginBottom:12 }}>Showing first 5 of {previewData.length}</p>}
          <div style={{ display:"flex", gap:8 }}>
            <Btn variant="ghost" onClick={()=>setImportStep(2)}>← Back</Btn>
            <Btn full variant="green" onClick={confirmImport}>Import {previewData.length} customers →</Btn>
          </div>
        </>}

        {importStep === 4 && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, marginBottom:6 }}>Import complete!</div>
            <Btn variant="green" style={{ marginTop:16 }} onClick={()=>{setShowImport(false);resetImport();}}>Done</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}
