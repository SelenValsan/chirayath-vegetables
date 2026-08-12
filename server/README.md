# Chirayath Vegetables — Backend API

Node.js / Express / MongoDB backend for the Chirayath Vegetables ledger & supply management system.

## Setup

```bash
cd server
npm install
cp .env.example .env   # then edit MONGO_URI / JWT_SECRET as needed
npm run seed            # populates the DB with sample shops, products, entries, payments
npm run dev              # starts on http://localhost:5000
```

Seeded login:
- Email: `owner@chirayathvegetables.com`
- Password: `password123`

`npm run seed -- --destroy` wipes all collections without reseeding.

## Architecture notes

**Financial integrity (Section 41/68 of the spec).** The shop's `currentBalance` is never
patched with `+`/`-` math directly. Every sale, payment, opening balance, or adjustment is written
as a `LedgerTransaction` row first. `services/ledgerService.recalculateShopBalance(shopId)` then
replays *all* non-voided ledger rows for that shop in chronological order starting from
`openingBalance`, rewrites each row's `balanceAfter`, and sets `Shop.currentBalance` to the final
number. This is called after every create/edit/void of an entry or payment, so:

- Editing a payment amount → ledger row updated → full replay → balance correct.
- Voiding (soft-deleting) an entry → its ledger row(s) marked `voided: true` and excluded from the
  replay → balance correct.
- No drift is possible, because balance is always *derived*, never incremented.

**Soft deletes.** Shops with any transaction history are archived (`isDeleted: true`,
`status: 'archived'`) instead of hard-deleted. Entries and payments are voided
(`status: 'voided'`) rather than removed, preserving the audit trail. Receipts tied to voided
records are marked `status: 'void'`.

**Receipts.** Numbered sequentially per year via an atomic `Counter` document
(`CV-2026-00001`, `CV-2026-00002`, ...) — no duplicates even under concurrent requests.

**Backend-authoritative totals.** `entryController.computeTotals()` always recalculates
`amount = quantity × rate`, `subtotal`, and `total` server-side. Frontend-sent totals are
never trusted directly.

## API routes

See `routes/index.js` for the full mount list. All routes except `/api/auth/register` and
`/api/auth/login` require a `Authorization: Bearer <token>` header.

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/shops                 ?search=&status=&page=&limit=&sort=
POST   /api/shops
GET    /api/shops/:id
PUT    /api/shops/:id
DELETE /api/shops/:id             archives if the shop has transaction history
PATCH  /api/shops/:id/status
GET    /api/shops/:id/ledger      ?from=&to=

GET    /api/products              ?search=&status=
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id          archives if used in past entries

GET    /api/entries               ?shopId=&from=&to=&status=&page=&limit=
POST   /api/entries
GET    /api/entries/:id
PUT    /api/entries/:id
DELETE /api/entries/:id           voids, reverses ledger + balance effect

GET    /api/payments              ?shopId=&method=&from=&to=&page=&limit=
POST   /api/payments
GET    /api/payments/:id
PUT    /api/payments/:id
DELETE /api/payments/:id          voids, reverses ledger + balance effect

GET    /api/transactions          ?shopId=&type=&from=&to=&page=&limit=
GET    /api/transactions/:id

GET    /api/receipts              ?shopId=&type=&page=&limit=
GET    /api/receipts/:id

GET    /api/reports/dashboard
GET    /api/reports/sales         ?range=today|week|month&from=&to=
GET    /api/reports/payments      ?range=&from=&to=
GET    /api/reports/outstanding
GET    /api/reports/top-shops     ?limit=
GET    /api/reports/top-products  ?limit=

GET    /api/search                ?q=   (global search across shops, entries, payments, receipts, products)
```

## Response format

```json
{ "success": true, "data": {}, "message": "Shop created successfully" }
{ "success": false, "message": "Shop not found", "errors": [] }
```

List endpoints also return a `meta` object: `{ page, limit, total, totalPages }`.

## Testing note

All files pass `node --check` (syntax verified). Full end-to-end testing against a live MongoDB
instance requires the DB itself — run `npm run seed` against your own local/Atlas MongoDB and then
hit `GET /api/health` and `POST /api/auth/login` to confirm connectivity.
