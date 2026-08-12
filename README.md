# Chirayath Vegetables

A digital business ledger and vegetable supply management system — replaces handwritten ledgers,
WhatsApp records, and spreadsheets for a vegetable supplier managing multiple shop customers.

Full-stack: **React + Vite + Tailwind** (client) / **Node + Express + MongoDB** (server).

## Quick start

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm run seed                # populates sample shops, products, entries, payments
npm run dev                  # http://localhost:5000
```

Seeded login: `owner@chirayathvegetables.com` / `password123`

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev                  # http://localhost:5173
```

Open `http://localhost:5173`, log in with the seeded credentials, and the app is fully functional
against real data.

## What's included

- **Auth** — JWT + bcrypt, protected routes, auto-logout on token expiry
- **Shops** — full CRUD, search, filter (all/active/pending balance/overdue), safe delete (archives
  shops with transaction history instead of hard-deleting)
- **Daily Entries** — multi-product line items, live totals, backend-recalculated totals (never
  trusts the frontend), auto-generates a receipt and optionally a payment
- **Payments** — record/edit/void, always reconciled against the shop's ledger
- **Shop Ledger & global Transactions** — running balance per shop, debit/credit view
- **Receipts** — sequential numbering (`CV-2026-00001`...), print & download
- **Reports** — sales trend, paid vs outstanding, top shops, top products, collection rate
- **Settings** — business profile, payment details (masked), receipt config
- **Global search** — shops, entries, payments, receipts, products from the top bar

## Balance integrity

See `server/README.md` for a full explanation of how `LedgerTransaction` + `recalculateShopBalance()`
guarantee the shop balance is always mathematically correct, no matter how many edits or voids
happen — this is the core financial logic of the whole app.

## Deployment

- **Database**: MongoDB Atlas (free M0 tier)
- **Backend**: Render / Railway — set the same env vars as `.env`, point `MONGO_URI` at Atlas
- **Frontend**: Vercel / Netlify — set `VITE_API_URL` to your deployed backend's URL

Once both are deployed you'll have a single website link that works from any device.
