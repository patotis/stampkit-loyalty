# StampKit — Digital Loyalty Card System

A complete digital loyalty card platform with:
- **Cashier app** — POS simulator, card scanner, member management
- **Customer card page** — web app customers bookmark on their phone
- **Real-time sync** via localStorage (same device) or Firebase (multi-device)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — PIN is **1234**

## Routes

| URL | What it is |
|-----|-----------|
| `/` | POS simulator |
| `/cashier` | Cashier QR + stamp scanner |
| `/builder` | Card builder |
| `/members` | Member list + CSV import |
| `/analytics` | Dashboard |
| `/settings` | PIN + settings |
| `/card` | **Customer-facing card page** — share this URL |

## Customer Flow

1. Customer scans your Join QR (from Cashier QR tab)
2. Opens `/card` in browser, enters name + phone
3. Gets a personal card with unique QR
4. Every visit: shows QR → cashier scans → stamp added
5. Card updates live in their browser

## Going Live (Multi-Device Sync)

1. Create a free Firebase project at https://console.firebase.google.com
2. Enable Firestore + Authentication (anonymous)
3. Replace the config in `src/lib/db.js` and set `DEMO_MODE = false`
4. Deploy with `npm run build` → `firebase deploy`

## Deployment (no Firebase)

Works as a static site for single-device use:
```bash
npm run build
# Deploy /dist to Netlify, Vercel, or any static host
```
