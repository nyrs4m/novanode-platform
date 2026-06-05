# NovaNode Inc. — AI Architect Context File

_Last updated: 2026-06-05_

## PLATFORM IDENTITY

- **Name:** NovaNode Inc.
- **Product:** Multi-tenant QR-based digital menu and order routing SaaS
- **Clients:** Restaurants, hotels, lounges
- **Tagline:** "Feast the Gen-Z way"
- **Live repo:** GitHub (public), deployed on Vercel free tier

---

## TECH STACK

- **Frontend:** Next.js 16.2.6 (App Router, Turbopack)
- **Styling:** Tailwind v4 — `@import "tailwindcss"` ONLY. No config file. No `@tailwind` directives.
- **Backend:** Supabase (PostgreSQL 14.5)
- **Realtime:** Supabase Realtime (postgres_changes)
- **Auth:** Supabase Auth (email/password)
- **Storage:** Supabase Storage (bucket: menu-images)
- **Connection:** Supabase Supavisor pooler (free tier: 16 connections)
- **Payments:** Paystack (test mode, integrated)
- **PDF:** jsPDF
- **QR:** qrcode.react (QRCodeCanvas)
- **Icons:** lucide-react@0.383.0
- **Hosting:** Vercel free tier

---

## DESIGN IDENTITY

- **Background:** Deep Obsidian Emerald `#022c22`
- **Surface:** `#064e3b` / `#043d30`
- **Gold accent:** `#D97706` / `#F59E0B`
- **Text:** Cream `#FDFBF7`
- **Font:** Inter
- **Philosophy:** Luxury dark, editorial cards, 3D tactile buttons, glassmorphism headers

---

## MONETIZATION MODEL

- Customer scans QR → views menu → places order → kitchen fulfills
- At checkout: **1% of food total, capped at GHS 5.00** is added as "Digital Service Fee" to customer bill
- This is calculated dynamically — NOT a flat fee
- On table close: `increment_daily_ledger` RPC is called with both `p_session_fee` and `p_platform_fee`
- Restaurant pays NovaNode daily via one-click Paystack button in KDS Ledger tab
- `daily_ledger` table tracks: `session_fees_collected`, `platform_fees_owed`, `platform_fees_paid`, `total_owed`, `paid_amount`
- After payment: `total_owed` resets to 0, `platform_fees_paid` accumulates (does NOT replace)

---

## GLOBAL GUARDRAILS

1. **Visual Identity:** Deep Obsidian Emerald background, Gold accents, Cream text, Inter font
2. **Monetization:** Dynamic 1% fee (max GHS 5) — never flat rate
3. **System Continuity:** Never auto-lock/suspend restaurants based on clock time. Manual suspension only via SuperAdmin
4. **Tech:** Next.js + Turbopack, Supabase strict multi-tenant RLS, realtime sync across terminals

---

## CRITICAL DO's

- Use `@import "tailwindcss"` in globals.css
- Use `proxy.ts` for Next.js 16 middleware (NOT `middleware.ts`)
- Use `lib/supabase/public.ts` for cached queries
- Use `useRef(createClient())` in client components — NEVER recreate client
- Access `supabaseRef.current` ONLY inside `useEffect` or event handlers (React 19 rule)
- Use `.maybeSingle()` for optional single-row queries
- Use `Promise.allSettled` for multiple queries that might fail
- Use `clearToken()` from `lib/session.ts` instead of `localStorage.removeItem` directly
- `lib/session.ts` uses localStorage with sessionStorage fallback (mobile private mode safe)

## CRITICAL DON'Ts

- NEVER use `@tailwind` directives
- NEVER create `tailwind.config.ts`
- NEVER rename `proxy.ts` to `middleware.ts`
- NEVER use `cookies()` inside `unstable_cache`
- NEVER use `Date.now()` or `new Date()` in SSR renders
- NEVER create multiple Supabase client instances per component
- NEVER use `.single()` — use `.maybeSingle()`
- NEVER read `supabaseRef.current` at render level
- NEVER use flat session fee — always dynamic 1% capped at 5.00
- NEVER rewrite entire files — patch only what is broken
- NEVER auto-suspend restaurants

---

## DATABASE SCHEMA (key tables)

### restaurants

`id, name, slug(unique), currency, logo_url, is_active, session_fee(decimal),
closing_time, payment_overdue, paystack_subaccount_code, suspended_at,
suspension_reason, suspended_by, owing_funds, is_suspended`

### orders

`id, restaurant_id, table_number, customer_name, session_token,
items(jsonb), total_amount, status(Pending/Preparing/Ready/Served/Cancelled),
is_starter_order, estimated_minutes, preparation_started_at, platform_fee`

### table_sessions

`id, restaurant_id, table_number, customer_name, session_token(unique),
is_active, browser_fingerprint, last_seen_at, bill_status(none/presented/paid),
status(active/completed), session_fee_applied, opened_at, closed_at`

### daily_ledger

`id, restaurant_id, ledger_date, completed_sessions, session_fee,
total_owed, is_paid, paystack_reference, paid_at, paid_amount,
session_fees_collected, platform_fees_owed, platform_fees_paid`
UNIQUE(restaurant_id, ledger_date)

### novanode_admins

`id, email(unique), created_at`

---

## KEY RPC FUNCTIONS

### increment_daily_ledger(p_restaurant_id, p_session_fee, p_platform_fee)

- Called on every table close
- UPSERTs daily_ledger for today
- Increments: completed_sessions, total_owed, session_fees_collected, platform_fees_owed
- Sets is_paid = false (resets after payment so new sessions accumulate)

---

## USER ROLES & ACCESS

### Customer (anon)

- Can SELECT: restaurants (is_active=true), categories, menu_items, table_sessions, orders
- Can INSERT: table_sessions, orders, waiter_signals, order_feedback, receipts

### Restaurant Staff (authenticated)

- Can SELECT/UPDATE: own restaurant's orders, sessions, signals, menu items
- Login at: `/login` → redirected to `/dashboard/[slug]`
- KDS at: `/kds/[slug]`

### SuperAdmin (authenticated, in novanode_admins)

- Login at: `/novanode/login` → redirected to `/novanode`
- Can access: all restaurants, all ledgers, suspension controls
- BLOCKED from: `/dashboard/[slug]` and `/kds/[slug]` routes
- Uses service role client for privileged queries

---

## TABLE SESSION LIFECYCLE

SCAN QR → check localStorage/sessionStorage token → rejoin OR new session
→ starters screen → menu page → ordering → bill signal
→ staff presents bill (bill_status='presented') → customer sees bill popup
→ staff confirms payment (bill_status='paid') → customer sees receipt + feedback
→ staff closes table → is_active=false, status='completed', closed_at=NOW()
→ increment_daily_ledger RPC → customer page reloads

---

## KNOWN ISSUES & THEIR FIXES

### React 19 ref rule

`supabaseRef.current` must NEVER be read at render level.
All access inside `useEffect` or `useCallback`/event handlers only.

### Mobile localStorage

`lib/session.ts` has localStorage + sessionStorage fallback.
Always use `clearToken()` not `localStorage.removeItem()` directly.

### Hydration mismatches

Never use `Date.now()`, `Math.random()`, or `window.*` in SSR.
Wrap in `useEffect` or lazy `useState` initializer.

### Multiple Supabase clients

Always `useRef(createClient())` — one instance per component lifetime.

### .single() throws on 0 rows

Always use `.maybeSingle()`.

### Duplicate staff rows

Use `.limit(1)` not `.maybeSingle()` on restaurant_staff queries.

### Stats views (restaurant_stats, menu_item_stats, peak_hours_stats)

Cast with `as never` when querying. Wrap in Promise.allSettled.

---

## FILE STRUCTURE (key files)

app/
(admin)/
dashboard/[restaurant_slug]/
page.tsx — server component, auth + staff guard
components/DashboardHome.tsx — 'use client', realtime counts
kds/[restaurant_slug]/
page.tsx — server component
components/KDSBoard.tsx — 'use client', full KDS with ledger tab
(customer)/[restaurant_slug]/
page.tsx — server component, unstable_cache
session.tsx — 'use client', session flow
components/
RestaurantApp.tsx — orchestrator
MenuClient.tsx — main customer page
OrderTracker.tsx — realtime order status
ReceiptModal.tsx — receipt + feedback
(novanode)/novanode/
page.tsx — server component, service role auth
login/page.tsx — superadmin login
components/SuperAdminPanel.tsx — 'use client', 4-tab control
api/
admin/create-staff/route.ts — POST, service role
paystack/
initialize/route.ts — POST, initialize payment
callback/route.ts — GET, verify + mark paid
webhook/route.ts — POST, signature verify
lib/
supabase/
client.ts — singleton browser client
server.ts — server client with cookies
public.ts — no-cookie client for unstable_cache
session.ts — localStorage + sessionStorage token management
sounds.ts — Web Audio API sounds
fingerprint.ts — browser fingerprint
realtime-engine.ts — shared channel map (not yet wired)
proxy.ts — Next.js 16 middleware replacement

---

## PAYMENT FLOW (Paystack)

1. Staff clicks "Pay Now" in KDS Ledger tab
2. POST `/api/paystack/initialize` → returns `authorization_url`
3. Browser redirects to Paystack checkout
4. On success → GET `/api/paystack/callback?reference=...`
5. Callback verifies payment, updates `daily_ledger`:
   - `is_paid = true`
   - `total_owed = 0`
   - `platform_fees_paid += amount_paid` (accumulates)
   - `paid_amount += amount_paid` (accumulates)
6. Redirects to `/kds/[slug]?payment=success`
7. KDS shows success banner and refreshes ledger

---

## CURRENT OPEN ISSUES (Priority Order)

1. Mobile sync bug — session token loss on private browsers (partially fixed)
2. SuperAdmin total orders/sessions showing zero (being fixed)
3. Revenue only counts from completed table sessions (fixed)
4. Realtime-engine.ts singleton not yet wired into components
5. Staff rating trigger not built (order_feedback inserts don't update staff ratings)
6. Paystack webhook handler exists but not tested end-to-end
7. French translations (name_fr) — AI auto-translation not built
8. Terms & Conditions page not built
