import { useState, useEffect } from "react";
import { getCustomers, getEvents, getConfig } from "../lib/db";
import { Card, CardHead, Badge } from "../components/UI";

export default function AnalyticsPage() {
  const [custs, setCusts] = useState([]);
  const [events, setEvents] = useState([]);
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    getConfig().then(setCfg);
    getCustomers().then(setCusts);
    setEvents(getEvents());
    const h = () => { getCustomers().then(setCusts); setEvents(getEvents()); };
    window.addEventListener("sk_update", h);
    return () => window.removeEventListener("sk_update", h);
  }, []);

  const stamps  = events.filter(e => e.type === "stamp").length;
  const redeems = events.filter(e => e.type === "redeem").length;
  const avgStamps = custs.length ? (custs.reduce((s,c) => s + c.stamps, 0) / custs.length).toFixed(1) : 0;
  const topCusts  = [...custs].sort((a,b) => b.pts - a.pts).slice(0,5);

  // Last 7 days stamp counts
  const days = Array.from({length:7}).map((_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const label = d.toLocaleDateString([], {weekday:"short"});
    const count = events.filter(e => {
      const t = new Date(e.time);
      return e.type === "stamp" && t.toDateString() === d.toDateString();
    }).length;
    return { label, count };
  });
  const maxDay = Math.max(...days.map(d => d.count), 1);

  const statCard = (label, val, color="var(--accent)") => (
    <Card key={label} style={{ padding:20 }}>
      <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", color:"var(--muted)", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Fraunces',serif", fontSize:38, color, lineHeight:1 }}>{val}</div>
    </Card>
  );

  return (
    <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {statCard("Active members", custs.length, "var(--accent)")}
        {statCard("Total stamps", stamps, "var(--green)")}
        {statCard("Redemptions", redeems, "var(--gold)")}
        {statCard("Avg stamps/member", avgStamps, "var(--text)")}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        {/* Bar chart */}
        <Card>
          <CardHead title="Stamps — Last 7 Days" />
          <div style={{ padding:20 }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:120 }}>
              {days.map((d,i) => (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>{d.count||""}</div>
                  <div style={{ width:"100%", background:"var(--warm)", borderRadius:"4px 4px 0 0", height:d.count ? `${(d.count/maxDay)*90}px` : 4, minHeight:4, background:i===6?"var(--accent)":"rgba(200,66,26,.25)", transition:"height .4s ease" }} />
                  <div style={{ fontSize:10, color:"var(--muted)" }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top customers */}
        <Card>
          <CardHead title="Top Members" />
          <div style={{ padding:"12px 16px" }}>
            {topCusts.length === 0 && <div style={{ fontSize:13, color:"var(--muted)", padding:"8px 0" }}>No members yet</div>}
            {topCusts.map((c,i) => (
              <div key={c.cardId} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<topCusts.length-1?"1px solid var(--paper)":"none" }}>
                <div style={{ fontSize:16, width:24, textAlign:"center" }}>{"🥇🥈🥉🏅🏅"[i]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>{c.stamps} stamps</div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", flexShrink:0 }}>{c.pts.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent events */}
      <Card>
        <CardHead title="Recent Activity" action={<Badge color="green">{events.length} total</Badge>} />
        <div style={{ padding:16 }}>
          {events.slice(0,10).map((e,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"9px 0", borderBottom:i<9?"1px solid var(--paper)":"none", fontSize:13 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:e.type==="redeem"?"var(--gold)":"var(--green)", flexShrink:0 }} />
              <span style={{ fontWeight:600 }}>{e.name}</span>
              <span style={{ color:"var(--muted)" }}>{e.type==="redeem" ? `🎁 Redeemed: ${e.reward}` : "+1 stamp"}</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:"var(--muted)", flexShrink:0 }}>{new Date(e.time).toLocaleString()}</span>
            </div>
          ))}
          {events.length === 0 && <div style={{ fontSize:13, color:"var(--muted)" }}>No activity yet — process a sale to see events here</div>}
        </div>
      </Card>
    </div>
  );
}
