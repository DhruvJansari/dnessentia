# DN Essentia: Next.js store

Storefront, checkout, customer accounts and admin panel for [dnessentia.com](https://dnessentia.com), replacing WordPress + WooCommerce.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 · MySQL 8 + Drizzle ORM · Razorpay · Shiprocket · SMTP (Nodemailer)

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run db:migrate              # create tables
npm run db:seed                 # products, FREEGIFT coupon, settings, first admin
npm run dev                     # http://localhost:3000  ·  admin at /admin
```

Log in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`, then change the password under **My account → Profile & password**.

## Environment (`.env.local`)

| Variable | What it's for |
| --- | --- |
| `DATABASE_URL` | `mysql://user:pass@127.0.0.1:3306/dnessentia`. Use a dedicated user in production (`scripts/setup-db.sql`). |
| `APP_URL` | Public URL, used in emails and webhook links. `https://dnessentia.com` in production. |
| `APP_SECRET` | Signs guest order-tracking links. Long random string; never change once live. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin, created by `npm run db:seed`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Outgoing email. Empty = emails are logged as "skipped" and printed to the console. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Use `rzp_test_…` keys while testing, `rzp_live_…` to go live. |
| `RAZORPAY_WEBHOOK_SECRET` | Secret you set on the Razorpay webhook. |
| `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` | A Shiprocket **API user** (Settings → API → Create API User), not your main login. |
| `SHIPROCKET_PICKUP_LOCATION` | Pickup location nickname exactly as in Shiprocket (default `Primary`). |
| `SHIPROCKET_PICKUP_PINCODE` | PIN code of the pickup address. Powers the "Delivers by" check at checkout and on product pages. |
| `SHIPROCKET_WEBHOOK_TOKEN` | Token you set on the Shiprocket tracking webhook. |
| `CRON_SECRET` | Protects `/api/cron/maintenance` (payment reminders and expiry of unpaid orders). |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID (`G-…`). Empty = no tracking. |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console HTML-tag verification code. |

**Email deliverability:** add SPF and DKIM records for dnessentia.com from your email provider, or order emails may land in spam.

Admin → Settings shows which integrations are configured and has "Send test email" / "Test connection" buttons.

## How orders flow

1. **Checkout** (`/checkout`) follows the WooCommerce flow: contact → shipping address → payment → note → Place order. Guests can tick **Create an account** to set a password; logged-in customers get saved addresses.
2. Prices, stock, combo picks and coupons are **re-checked on the server**; the browser's prices are never trusted.
3. **Razorpay**: the order is saved as *pending/unpaid*, Razorpay Checkout opens, and the payment signature is verified server-side. The **webhook** confirms the payment even if the customer closes the tab. Unpaid orders show a "Pay now" button on their order page.
4. On confirmation: stock is deducted, the coupon use is counted, the customer gets a confirmation email, and the admin gets a new-order email.
5. **Shipping**: Admin → order → **Create shipment** creates the Shiprocket order, assigns a courier + AWB, requests pickup, marks the order *shipped* and emails tracking. Turn on *auto-create* in Settings to skip the click. The tracking webhook (or **Sync tracking**) moves it to *delivered*.
6. Customers track orders in **My account**, or as guests via the emailed link or `/track` (order number + email). Verifying the email attaches earlier guest orders to the account.

COD exists but is **off by default** (the current site is Razorpay-only). Toggle it in Admin → Settings → Payments.

### After the order

- **Invoices**: every confirmed order gets a sequential GST invoice number (`DN/2026-27/0001`). Customers download it from their order page; staff open it from the admin order. CGST + SGST within your state, IGST otherwise. Fill Admin → Settings → Business (GSTIN, address) before going live.
- **Cancellation**: customers can cancel within 12 hours, before dispatch. Prepaid orders keep a 50% cancellation charge and the rest is refunded through Razorpay automatically; COD and unpaid orders cancel free. Admins can also cancel with a full, policy or no refund.
- **No returns, replacement only**: within 3 days of delivery, customers report damaged / leaked / wrong / missing items with photos and an unboxing video link. Approving creates a free replacement order that ships like any other. Delivery and packaging charges are not refunded.
- **Unpaid orders**: a reminder email goes out after 1 hour; still-unpaid online orders are cancelled after 24 hours. All windows and percentages are editable in Admin → Settings → Policies.

### Scheduled job

Add this to the server's crontab so reminders and expiry run every 15 minutes:

```
*/15 * * * * curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://dnessentia.com/api/cron/maintenance
```

Admin → Settings → Policies also has a **Run now** button.

### Storefront extras

Product reviews (verified buyers publish instantly, others are moderated), instant search (header icon or the `/` key), wishlist (saved to the account when logged in), recently viewed, 1 ml sample suggestions in the bag, FREEGIFT adds the chosen sample as a ₹0 line, GA4 e-commerce events (view_item, add_to_cart, begin_checkout, purchase, search, add_to_wishlist), product + breadcrumb + organization structured data, Contact page with inbox, Terms & Conditions.

## Webhooks to configure

| Service | URL | Events / notes |
| --- | --- | --- |
| Razorpay → Settings → Webhooks | `https://dnessentia.com/api/webhooks/razorpay` | `payment.captured`, `payment.failed`, `order.paid`; secret = `RAZORPAY_WEBHOOK_SECRET` |
| Shiprocket → Settings → API → Webhooks | `https://dnessentia.com/api/webhooks/shipping-updates` | Token = `SHIPROCKET_WEBHOOK_TOKEN` (Shiprocket rejects URLs containing "shiprocket") |

Every webhook received is logged under Admin → Activity → Webhooks.

## Admin panel (`/admin`)

- **Dashboard**: revenue with a 7 / 30 / 90-day chart and change vs the previous period, orders by status, ready-to-ship, low stock, latest activity.
- **Orders**: search, filter and **CSV export with GST split**; detail page with items, customer, payment, shipment (create, sync, **print label**), invoice, status changes, cancel with refund choice, refunds, notes, email resend, replacement requests, and a plain-language **timeline** grouped by day.
- **Replacements**: every damaged / leaked / wrong / missing report, with photos and video links; approve or reject.
- **Reviews**: approve, hide, reply to or delete product reviews.
- **Messages**: inbox for the Contact page.
- **Products**: edit content, images (upload), variants, prices, MRP, stock, weight; publish/hide; best sellers. Saves go live on the store immediately.
- **Users**: customers and team, add a user (they get a set-password email), edit name / email / phone, change role, signed-in devices and "sign out everywhere", mark verified, disable, CSV export.
- **Coupons**: % off, ₹ off or free gift; minimum order, usage limit, start/end dates.
- **Emails**: every email sent, failed or skipped.
- **Activity**: audit log of every admin change (who, what, when, IP, before/after) and every webhook.
- **Settings**: shipping fee, free-shipping threshold, COD, auto-shipment, box size, notifications, **business details for invoices**, **policies** (cancellation, replacement, unpaid-order timers), store info, integration status, team.

Roles: **admin** (everything), **staff** (orders, products, customers, but not settings, coupons, roles or refunds), **customer**.
Add staff from Admin → Users → Add a user (role Staff), or change an existing user's role, or run `npm run admin:create -- email "password" staff`.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed products, coupon, settings, first admin (safe to re-run) |
| `npm run db:studio` | Browse the database |
| `npm run admin:create -- email "password" [admin\|staff]` | Create an admin or reset their password |

## Project layout

```
src/app/(store)/      storefront, checkout, account, order pages
src/app/admin/        admin panel (pages + server actions)
src/app/api/webhooks/ Razorpay and Shiprocket webhooks
src/db/               schema, connection, seed data
src/lib/              auth, orders, pricing, catalog, mail, razorpay, shiprocket, settings, audit
src/components/       UI (store, checkout, admin)
storage/uploads/      admin-uploaded images (served at /media/...); back this up
```

## Going live checklist

1. Server with Node.js 20+ and MySQL 8 (e.g. a VPS), run behind Nginx with HTTPS. Keep the app running with PM2 (`pm2 start npm --name dnessentia -- start`).
2. Create a dedicated DB user (`scripts/setup-db.sql`) and set `DATABASE_URL` to it. `npm run db:migrate && npm run db:seed`.
3. Set `APP_URL=https://dnessentia.com`, a fresh `APP_SECRET`, live Razorpay keys, SMTP and Shiprocket credentials.
4. Configure both webhooks (above) and use the Settings test buttons.
5. Set real stock levels in Admin → Products (seeded at 100 each) and confirm the shipping fee (seeded at ₹49 below ₹299).
6. `npm run build && npm start`. The build reads products from the database, so MySQL must be reachable during the build.
7. Back up MySQL and `storage/uploads/` daily.
8. Point the domain at the new server. Old WordPress product URLs redirect automatically (see `next.config.ts`).
