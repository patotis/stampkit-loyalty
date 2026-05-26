import { useState, useEffect } from "react";
import { getCustomers, addStamp, redeemReward, getEvents, getConfig } from "../lib/db";
import { Card, CardHead, Btn, Badge, toast } from "../components/UI";

const PRODUCTS = [
  { name:"Flat White",    icon:"☕", price:4.50 },
  { name:"Croissant",     icon:"🥐", price:3.00 },
  { name:"Matcha Latte",  icon:"🍵", price:5.50 },
  { name:"Avo Toast",     icon:"🥑", price:9.00 },
  { name:"Espresso",      icon:"🫘", price:2.80 },
  { name:"Cake Slice",    icon:"🍰", price:4.00 },
  { name:"OJ",            icon:"🍊", price:3.50 },
  { name:"Bagel",         icon:"🥯", price:5.00 },
];

export default function POSPage() {
  const [cart, setCart] = useState([]);
  const [events, setEvents] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [flash, setFlash] = useState(null);
  const [selectedCust, setSelectedCust] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState("");
  const [showCustPicker, setShowCustPicker] = useState(false);

  useEffect(() => {
    getConfig().then(setCfg);
    getCustomers().then(setCustomers);
    setEvents(getEvents().slice(0, 12));
    const handler = () => {
      getCustomers().then(setCustomers);
      setEvents(getEvents().slice(0, 12));
    };
    window.addEventListener("sk_update", handler);
    return () => window.removeEventListener("sk_update", handler);
  }, []);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function addToCart(p) {
    setCart(prev => {
      const ex = prev.find(i => i.name === p.name);
      return ex ? prev.map(i => i.name === p.name ? { ...i, qty: i.qty + 1 } : i)
                : [...prev, { ...p, qty: 1 }];
    });
  }

  async function checkout() {
    if (!cart.length) return;
    let customer = selectedCust;

    if (!customer) {
      // Auto-find most recent customer if no one selected
      const all = await getCustomers();
      customer = all[0] || null;
    }

    if (customer) {
      const updated = await addStamp(customer.cardId);
      const reward  = cfg?.rewards?.find(r => r.stamps === updated?.stamps);
      setFlash({
        type:    reward ? "reward" : "stamp",
        title:   reward ? "🎁 Reward Earned!" : "✦ Stamp Added!",
        sub:     reward ? `${reward.name} for ${customer.name}` : `${updated?.stamps}/${cfg?.goal} for ${customer.name}`,
        bg:      reward ? "var(--gold)" : "var(--green)",
        textCol: reward ? "var(--ink)" : "#fff",
      });
      setEvents(getEvents().slice(0, 12));
      if (selectedCust) setSelectedCust({ ...selectedCust, stamps: updated.stamps, pts: updated.pts });
    } else {
      setFlash({ type:"stamp", title:"✦ Sale Processed", sub: `€${total.toFixed(2)}`, bg:"var(--green)", textCol:"#fff" });
    }

    setTimeout(() => setFlash(null), 2000);
    setCart([]);
    toast("Payment processed" + (customer ? ` · stamp added for ${customer.name}` : ""), "ok");
  }

  const filteredCusts = customers.filter(c =>
    !custSearch || c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.email.includes(custSearch)
  );

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20, padding:20, minHeight:0 }}>

      {/* LEFT */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Customer selector */}
        <Card>
          <CardHead title="Current Customer" action={
            <div style={{ display:"flex", gap:8 }}>
              {selectedCust && <Btn size="sm" variant="ghost" onClick={() => setSelectedCust(null)}>Clear</Btn>}
              <Btn size="sm" onClick={() => setShowCustPicker(true)}>
                {selectedCust ? "Change" : "Select Customer"}
              </Btn>
            </div>
          } />
          <div style={{ padding:16 }}>
            {selectedCust ? (
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--warm)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {selectedCust.name[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:600 }}>{selectedCust.name}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{selectedCust.email || selectedCust.phone}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{selectedCust.stamps}/{cfg?.goal} stamps</div>
                  <div style={{ fontSize:11, color:"var(--muted)" }}>{selectedCust.pts} pts</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize:13, color:"var(--muted)", display:"flex", alignItems:"center", gap:8 }}>
                <span>No customer selected —</span>
                <button onClick={() => setShowCustPicker(true)} style={{ color:"var(--accent)", background:"none", border:"none", fontWeight:600, cursor:"pointer" }}>
                  find customer
                </button>
                <span>or stamp will apply to last active customer</span>
              </div>
            )}
          </div>
        </Card>

        {/* Products */}
        <Card>
          <CardHead title="Products" />
          <div style={{ padding:16, display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {PRODUCTS.map(p => (
              <button key={p.name} onClick={() => addToCart(p)} style={{
                background:"var(--warm)", border:"1.5px solid var(--border)", borderRadius:12,
                padding:"14px 8px", textAlign:"center", cursor:"pointer", transition:".12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.background="rgba(200,66,26,.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--warm)"; }}
              >
                <div style={{ fontSize:28, marginBottom:5 }}>{p.icon}</div>
                <div style={{ fontSize:12, fontWeight:600 }}>{p.name}</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>€{p.price.toFixed(2)}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Cart */}
        <Card>
          <CardHead title="Current Order" action={
            cart.length > 0 && <Btn size="sm" variant="ghost" onClick={() => setCart([])}>Clear</Btn>
          } />
          <div style={{ padding:16 }}>
            {cart.length === 0
              ? <div style={{ fontSize:13, color:"var(--muted)" }}>No items — tap a product above</div>
              : <>
                {cart.map(i => (
                  <div key={i.name} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"5px 0", borderBottom:"1px solid var(--paper)" }}>
                    <span>{i.icon} {i.name}{i.qty > 1 ? ` ×${i.qty}` : ""}</span>
                    <span style={{ fontWeight:600 }}>€{(i.price*i.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700, marginTop:12, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </>
            }
            <Btn full variant="green" size="lg" style={{ marginTop:14 }} onClick={checkout} disabled={cart.length === 0}>
              💳 Process & Stamp Customer
            </Btn>
          </div>
        </Card>
      </div>

      {/* RIGHT: Event log */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <Card style={{ flex:1 }}>
          <CardHead title="Webhook Events" action={<Badge color="green">● Live</Badge>} />
          <div style={{ padding:16, display:"flex", flexDirection:"column", gap:6 }}>
            {events.length === 0
              ? <div style={{ fontSize:12, color:"var(--muted)" }}>Waiting for events…</div>
              : events.map((e, i) => (
                <div key={i} style={{
                  display:"grid", gridTemplateColumns:"8px 1fr auto", gap:8, alignItems:"center",
                  padding:"8px 10px", background:"var(--warm)", borderRadius:9, fontSize:12,
                  borderLeft:`3px solid ${e.type==="redeem" ? "var(--gold)" : "var(--green)"}`,
                  animation:"slideIn .2s ease",
                }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background: e.type==="redeem" ? "var(--gold)" : "var(--green)" }} />
                  <div>
                    <span style={{ fontWeight:600 }}>{e.name}</span>
                    {" "}<span style={{ color:"var(--muted)" }}>
                      {e.type==="redeem" ? `🎁 ${e.reward}` : "+1 stamp"}
                    </span>
                  </div>
                  <div style={{ fontSize:10, color:"var(--muted)", whiteSpace:"nowrap" }}>
                    {new Date(e.time).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Customer picker modal */}
      {showCustPicker && (
        <div onClick={e => e.target===e.currentTarget && setShowCustPicker(false)} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.5)", backdropFilter:"blur(8px)",
          zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }}>
          <div style={{ background:"#fff", borderRadius:20, padding:24, maxWidth:440, width:"100%", maxHeight:"80vh", overflowY:"auto" }}>
            <h2 style={{ fontSize:20, marginBottom:14 }}>Find Customer</h2>
            <input
              autoFocus value={custSearch} onChange={e => setCustSearch(e.target.value)}
              placeholder="Search by name or email…"
              style={{ width:"100%", padding:"10px 13px", background:"var(--warm)", border:"1.5px solid var(--border)", borderRadius:10, fontSize:14, outline:"none", marginBottom:12 }}
            />
            {filteredCusts.slice(0,8).map(c => (
              <div key={c.cardId} onClick={() => { setSelectedCust(c); setShowCustPicker(false); setCustSearch(""); }}
                style={{ display:"flex", alignItems:"center", gap:12, padding:12, borderRadius:12, cursor:"pointer", border:"1px solid var(--border)", marginBottom:8, transition:".1s" }}
                onMouseEnter={e => e.currentTarget.style.background="var(--warm)"}
                onMouseLeave={e => e.currentTarget.style.background="#fff"}
              >
                <div style={{ width:38, height:38, borderRadius:"50%", background:"var(--warm)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:15, flexShrink:0 }}>{c.name[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>{c.email || c.phone}</div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--accent)", flexShrink:0 }}>{c.stamps}/{cfg?.goal}</div>
              </div>
            ))}
            {filteredCusts.length === 0 && <div style={{ fontSize:13, color:"var(--muted)", textAlign:"center", padding:"20px 0" }}>No customers found</div>}
          </div>
        </div>
      )}

      {/* Stamp flash */}
      {flash && (
        <div style={{
          position:"fixed", inset:0, background: flash.bg + "ee",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          zIndex:400, gap:10, animation:"fadeIn .25s ease",
        }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:40, color: flash.textCol }}>{flash.title}</div>
          <div style={{ fontSize:18, color: flash.textCol, opacity:.85 }}>{flash.sub}</div>
        </div>
      )}

      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
    </div>
  );
}
