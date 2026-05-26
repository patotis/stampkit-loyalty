// StampKit Data Layer
// Works in DEMO mode (localStorage) out of the box.
// To go live: replace FIREBASE_CONFIG and set DEMO_MODE = false

export const DEMO_MODE = true; // flip to false after setting up Firebase

// ── Default card config ──
const DEFAULT_CFG = {
  biz:     "Bloom Cafe",
  tagline: "Sip, earn, repeat.",
  color:   "linear-gradient(135deg,#1a0a00,#c8421a,#d4a017)",
  goal:    8,
  ptsLabel:"points",
  rewards: [
    { id:"r1", name:"Free drink",  desc:"Any drink on us",     stamps:8  },
    { id:"r2", name:"20% off",     desc:"Off your next order", stamps:16 },
    { id:"r3", name:"VIP status",  desc:"Unlock VIP perks",    stamps:24 },
  ]
};

// ── localStorage keys ──
const KEY_CFG      = "sk_config";
const KEY_CUSTS    = "sk_customers";
const KEY_EVENTS   = "sk_events";
const KEY_PIN      = "sk_pin";

function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function genId(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
export async function getConfig() {
  return ls(KEY_CFG, DEFAULT_CFG);
}
export async function saveConfig(cfg) {
  lsSet(KEY_CFG, cfg);
  // Broadcast to customer pages open in same browser
  window.dispatchEvent(new StorageEvent("storage", { key: KEY_CFG }));
}

// ─────────────────────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────────────────────
export async function getCustomers() {
  return ls(KEY_CUSTS, []);
}
export async function getCustomer(cardId) {
  const all = ls(KEY_CUSTS, []);
  return all.find(c => c.cardId === cardId) || null;
}
export async function createCustomer({ name, phone, email }) {
  const cardId = genId("SK");
  const now = new Date().toISOString();
  const customer = {
    cardId, name, phone: phone || "", email: email || "",
    stamps: 0, pts: 0, joined: now,
    history: [{ type:"join", label:`Joined`, time: now }]
  };
  const all = ls(KEY_CUSTS, []);
  all.unshift(customer);
  lsSet(KEY_CUSTS, all);
  return customer;
}
export async function addStamp(cardId) {
  const all = ls(KEY_CUSTS, []);
  const idx = all.findIndex(c => c.cardId === cardId);
  if (idx < 0) return null;
  const cfg = ls(KEY_CFG, DEFAULT_CFG);
  all[idx].stamps = Math.min(all[idx].stamps + 1, cfg.goal * 3);
  all[idx].pts += 50;
  all[idx].history = all[idx].history || [];
  all[idx].history.push({ type:"stamp", label:`Stamp added`, time: new Date().toISOString() });
  lsSet(KEY_CUSTS, all);
  logEvent({ type:"stamp", cardId, name: all[idx].name });
  return all[idx];
}
export async function redeemReward(cardId, reward) {
  const all = ls(KEY_CUSTS, []);
  const idx = all.findIndex(c => c.cardId === cardId);
  if (idx < 0) return null;
  all[idx].history = all[idx].history || [];
  all[idx].history.push({ type:"redeem", label:`Redeemed: ${reward.name}`, time: new Date().toISOString() });
  all[idx].stamps = Math.max(0, all[idx].stamps - reward.stamps);
  lsSet(KEY_CUSTS, all);
  logEvent({ type:"redeem", cardId, name: all[idx].name, reward: reward.name });
  return all[idx];
}
export async function importCustomers(rows) {
  const all = ls(KEY_CUSTS, []);
  let added = 0, updated = 0;
  const now = new Date().toISOString();
  rows.forEach(r => {
    const existing = r.email ? all.find(c => c.email === r.email) : null;
    if (existing) {
      if (r.stamps > 0) existing.stamps = r.stamps;
      if (r.pts > 0) existing.pts = r.pts;
      updated++;
    } else {
      all.unshift({
        cardId: genId("SK"),
        name: r.name, email: r.email || "", phone: r.phone || "",
        stamps: r.stamps || 0, pts: r.pts || 0,
        joined: now,
        history: [{ type:"import", label:"Imported", time: now }]
      });
      added++;
    }
  });
  lsSet(KEY_CUSTS, all);
  return { added, updated };
}
// Subscribe to customer changes (same tab)
export function subscribeCustomer(cardId, cb) {
  const handler = () => {
    const all = ls(KEY_CUSTS, []);
    const c = all.find(x => x.cardId === cardId);
    if (c) cb(c);
  };
  window.addEventListener("storage", handler);
  window.addEventListener("sk_update", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("sk_update", handler);
  };
}
export function triggerUpdate() {
  window.dispatchEvent(new Event("sk_update"));
}

// ─────────────────────────────────────────────────────────────
// EVENTS LOG
// ─────────────────────────────────────────────────────────────
function logEvent(evt) {
  const events = ls(KEY_EVENTS, []);
  events.unshift({ ...evt, time: new Date().toISOString() });
  lsSet(KEY_EVENTS, events.slice(0, 200));
  triggerUpdate();
}
export function getEvents() {
  return ls(KEY_EVENTS, []);
}

// ─────────────────────────────────────────────────────────────
// PIN
// ─────────────────────────────────────────────────────────────
export function getPin()     { return ls(KEY_PIN, "1234"); }
export function savePin(pin) { lsSet(KEY_PIN, pin); }
export function checkPin(pin){ return pin === getPin(); }
