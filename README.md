# RapidCard.pro — Billing portal

Client billing portal (Vite + React + Refine + Ant Design). English UI. Clients
issue and manage cards, fund balances with USDT, view transactions, tickets, and
manage API keys.

Production: **https://era.rapidcard.pro** → API at **https://v2.api.rapidcard.pro**.

## Deploy on Vercel

1. Vercel → **Add New → Project** → import this GitHub repo.
2. Framework preset: **Vite** (auto-detected). Build `npm run build`, output `dist`
   (already declared in `vercel.json`, which also adds the SPA rewrite).
3. Environment variable (Project → Settings → Environment Variables):
   - `VITE_API_URL = https://v2.api.rapidcard.pro`
   (Also committed in `.env.production` so builds work out of the box.)
4. Add the domain **era.rapidcard.pro** (Project → Settings → Domains).
5. Make sure the API's `CORS_ORIGINS` includes `https://era.rapidcard.pro`.

## Local development

```bash
npm install
# .env → VITE_API_URL=http://localhost:4000
npm run dev      # http://localhost:5174
```
