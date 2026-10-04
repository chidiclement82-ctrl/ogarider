# Ogarider

A food-ordering app for Nigeria: customers order from any restaurant and pay online or on delivery,
restaurants fulfil the orders, and an admin manages restaurants, menus, prices and pictures.

## Run

```bash
npm run dev
```

Open http://localhost:3000. Requires Node 22.5+ (uses the built-in `node:sqlite`).

The database is created and seeded at `data/app.db` on first run; uploaded pictures go to
`data/uploads`. Delete the `data` folder to reset everything.

The sign-in page has one-click demo accounts for customer, restaurant and admin (development
only); they are defined in `src/lib/seed.ts`.

## Setup

Copy `.env.example` to `.env.local` and fill it in:

- `PAYSTACK_SECRET_KEY` — from the Paystack dashboard. Without it, development shows a payment
  simulator and production refuses online payment.
- `APP_URL` — the public address of the app, used for the payment return link.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your real admin account, applied every time the app
  starts. Change `ADMIN_PASSWORD` and restart to reset the password.

In the Paystack dashboard, set the webhook URL to `<APP_URL>/api/paystack/webhook`.

## Layout

- `src/lib/db.ts` — schema and query helpers
- `src/lib/seed.ts` — demo restaurants, menus and accounts
- `src/lib/auth.ts` — cookie sessions and role checks
- `src/lib/paystack.ts` — start and verify online payments
- `src/lib/uploads.ts` — picture uploads
- `src/lib/cart.ts` — browser cart (localStorage)
- `src/lib/format.ts` — app name, currency, order statuses
- `src/app/actions.ts` — customer and restaurant actions
- `src/app/admin/` — admin site and its actions
- `src/app/` — pages: home, `restaurants/[id]`, `checkout`, `orders`, `dashboard`, `pay`

## Going live

The app keeps its database and uploaded pictures on disk, so it needs a host with a
**persistent disk** (Railway, Render, Fly.io or any VPS). Serverless hosts without a disk,
such as Vercel, will lose data.

1. Push this project to a GitHub repository and connect it to the host. The included
   `Dockerfile` builds and runs it.
2. Attach a persistent disk mounted at `/data`.
3. Set these variables on the host: `PAYSTACK_SECRET_KEY` (live key), `APP_URL`
   (your https address), `ADMIN_EMAIL`, `ADMIN_PASSWORD`. `DATA_DIR=/data` is already set
   by the Dockerfile.
4. In the Paystack dashboard, set the webhook URL to `<APP_URL>/api/paystack/webhook`.

A live server starts empty: no demo restaurants and no demo accounts, only the admin from
`ADMIN_EMAIL` / `ADMIN_PASSWORD`. The setup page and payment simulator are off. Do not copy
your local `data` folder to the server; it contains the demo accounts.
