# ProsubX — User Portal Complete Rebuild Prompt

## Context

This is the **User (Portal) Panel** for ProsubX — a subscription management SaaS.
Tech stack: **Next.js 14 App Router**, **shadcn/ui**, **Tailwind CSS**, **Framer Motion**, **Zustand**, **React Hook Form + Zod**, **Recharts**.
Route group: `src/app/(portal)/` — protected by `<AuthGuard allowedRoles={['portal']}>`.

The backend is **fully complete** at `http://localhost:5000`.
API base via `NEXT_PUBLIC_API_URL` → axios instance at `src/lib/api.ts`.
Primary color: Indigo-500 (`#6366f1`). Design language: clean white cards, slate text, subtle borders.

---

## What Already Exists (Do NOT delete — rebuild/enhance in-place)

| File | Current state |
|------|--------------|
| `(portal)/layout.tsx` | AuthGuard + PortalNav + `max-w-6xl` container |
| `(portal)/home/page.tsx` | 3 KPI cards + active subs list + pending invoices list |
| `(portal)/shop/page.tsx` | Product grid + search, no image, no category filter |
| `(portal)/shop/[productId]/page.tsx` | Product detail + variant + plan select + qty — needs subscription period |
| `(portal)/cart/page.tsx` | Cart with qty controls + order summary + checkout → `POST /api/subscriptions/from-cart` |
| `(portal)/orders/page.tsx` | Flat list of subscriptions |
| `(portal)/orders/[orderId]/page.tsx` | Subscription detail, no invoice links, no actions |
| `(portal)/my-invoices/page.tsx` | Invoice list, no status filter |
| `(portal)/my-invoices/[id]/page.tsx` | Invoice detail + Razorpay payment |
| `(portal)/profile/page.tsx` | Full profile edit form |
| `(portal)/my-account/page.tsx` | Profile edit + change password (partially duplicates profile) |
| `src/components/layout/PortalNav.tsx` | Sticky header nav with cart badge + user dropdown |
| `src/stores/cart.ts` | Zustand persist store: items, addItem, removeItem, updateQuantity |

---

## Backend APIs Available for Portal

```
GET    /api/products?is_active=true          → product list
GET    /api/products/:id                     → product + variants array
GET    /api/products/:id/variants            → variant list
GET    /api/recurring-plans?is_active=true   → plans list
GET    /api/subscriptions/my                 → portal user's subscriptions
POST   /api/subscriptions/from-cart          → create subscription from cart
GET    /api/subscriptions/:id               → subscription detail + lines
GET    /api/invoices/my                     → portal user's invoices (paginated)
GET    /api/invoices/:id                    → invoice detail + lines
GET    /api/invoices/:id/payment-status     → { amount_paid, amount_outstanding }
POST   /api/payments/order                  → { invoice_id } → Razorpay order
POST   /api/payments/verify                 → verify Razorpay payment
PUT    /api/auth/profile                    → update profile
POST   /api/auth/change-password            → change password
GET    /api/auth/me                         → current user
```

### Backend Change Required: Extend `POST /api/subscriptions/from-cart`

The current `fromCart` controller in `backend/controllers/subscriptionController.js` needs to accept `billing_period` and compute `expiration_date`. Update the request body to include:

```json
{
  "items": [...],
  "plan_id": "uuid-or-null",
  "billing_period": "monthly|weekly|yearly|daily",
  "start_date": "2026-04-05",
  "notes": "optional"
}
```

And compute `expiration_date` in the controller:
```js
const billing_period = req.body.billing_period || 'monthly'
const start = new Date(req.body.start_date || new Date())
let expiration_date
if (billing_period === 'daily')   expiration_date = new Date(start.setDate(start.getDate() + 1))
if (billing_period === 'weekly')  expiration_date = new Date(start.setDate(start.getDate() + 7))
if (billing_period === 'monthly') expiration_date = new Date(start.setMonth(start.getMonth() + 1))
if (billing_period === 'yearly')  expiration_date = new Date(start.setFullYear(start.getFullYear() + 1))
// Store expiration_date in the INSERT
```

Also update the INSERT to include `expiration_date`, `status='active'` (not the default `draft`), and `notes`.

---

## Zustand Cart Store — Add `billing_period` and `start_date`

In `src/stores/cart.ts`, add these two global fields to the store (not per-item):

```ts
billing_period: 'monthly' | 'weekly' | 'yearly' | 'daily'
start_date: string   // ISO date string, default = today
setBillingPeriod: (bp: BillingPeriod) => void
setStartDate: (d: string) => void
```

These are set globally for the whole cart (one subscription = one billing period).
`CartItem` type already has `plan_id` — keep it.

---

## Pages to Rebuild / Enhance

---

### 1. `/home` — Dashboard Home

**Goal:** Rich, data-dense welcome screen. Replace the minimal 3-card layout.

#### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome back, Priya! 👋  (greeting based on time of day)        │
│ Here's what's happening with your subscriptions today.          │
├──────────┬──────────┬──────────┬──────────────────────────────-─┤
│ Active   │ Pending  │ Total    │  Next Invoice Due               │
│ Subs: 3  │ Inv: 2   │ Spent ₹  │  INV-2026-00003 · ₹4,500       │
│          │          │ 42,000   │  Due in 3 days · [Pay Now]      │
└──────────┴──────────┴──────────┴────────────────────────────────┘
```

#### Sections

**a) KPI Row (4 cards)**
- Active subscriptions count
- Pending invoices count (with total amount due)
- Total amount spent this year (sum of paid invoice `grand_total`)
- Next invoice due date + amount + inline "Pay Now" button (links to invoice detail)

**b) Active Subscriptions Panel**
- Show up to 3 active subscriptions
- Each row: subscription number, plan name, billing period badge (Monthly/Weekly/Yearly), progress bar showing days used vs total period (e.g. "18 of 30 days"), status badge, expiry date
- "Renew" chip if expiry < 7 days away (orange warning)
- "View all →" link to `/orders`

**c) Expiring Soon Alert Banner**
- If any subscription expires within 7 days: show amber alert banner at top
- `⚠️ Your subscription SUB-2026-00002 expires in 4 days. Renew now →`

**d) Recent Invoices Panel**
- Last 3 invoices: number, date, amount, status badge
- If status = `confirmed` → show inline "Pay ₹X" button
- "View all →" link to `/my-invoices`

**e) Quick Actions Row**
```
[🛒 Shop Products]  [📄 View Invoices]  [👤 Edit Profile]  [🔄 My Orders]
```

**f) Empty state** — if new user with 0 subscriptions:
- Large illustration area + "You haven't subscribed to anything yet"
- CTA: "Browse Shop →"

---

### 2. `/shop` — Product Shop

**Goal:** Full e-commerce style shop with filters, rich product cards.

#### Features

**a) Header + Search bar**
- Page title "Shop" + subtitle "Browse and subscribe to our services"
- Search input (debounce 300ms), searches name + description
- Product count: "Showing 12 products"

**b) Filter Bar (horizontal pill filters)**
- Product type filter: All | Service | Physical | Digital | Other (pill tabs)
- Sort dropdown: Newest | Price: Low to High | Price: High to Low | Name A–Z

**c) Product Grid (3 columns on lg, 2 on md, 1 on sm)**

Each product card must show:
- Product image (if `image_url` exists, show `<Image>`, else show a colored placeholder with product initial)
- Product type badge (top-left corner, e.g. "Service", "Digital")
- Product name (font-semibold, hover → indigo)
- Description (2-line clamp)
- Price: `₹X,XXX` (large, bold, indigo)
- Variant count badge if variants > 0: "3 variants"
- "Add to Cart" button (full width, indigo) — opens quick-add with quantity selector inline on the card (no navigation needed for simple add)
- "View Details →" link (small text below button)
- If item already in cart: show "In Cart ✓" green badge + quantity stepper instead of Add button

**d) Skeleton loading** — 6 cards with pulse animation
**e) Empty state** — PackageIcon + "No products match your search"
**f) Framer Motion** — cards stagger in with `initial={{ opacity:0, y:20 }}` delay per index

---

### 3. `/shop/[productId]` — Product Detail

**Goal:** Full product page with all configuration options before adding to cart.

#### Layout: 2-column (image/info left, purchase panel right)

**Left column:**
- Product image (large, rounded-xl, fallback gradient placeholder)
- Product name (2xl bold)
- Type badge + HSN/SAC code (if available)
- Description (full, not clamped)
- Feature highlights: if description has line breaks, render as bullet list
- "✅ Active product" green indicator

**Right column (sticky purchase card):**

```
┌──────────────────────────────────────┐
│ ₹2,499                               │
│ per month (based on plan)            │
│                                      │
│ Variant: [Select ▾]                  │
│   (only if variants exist)           │
│                                      │
│ Subscription Plan:                   │
│ ○ Monthly  ○ Weekly  ○ Yearly        │
│ ○ One-time purchase                  │
│   (radio buttons with price/period)  │
│                                      │
│ Start Date: [date picker]            │
│ End Date:   Auto-calculated          │
│ (e.g. "Apr 5 → May 5, 2026")        │
│                                      │
│ Quantity: [ - 1 + ]                  │
│                                      │
│ ─────────────────────────────────    │
│ Total: ₹2,499                        │
│                                      │
│ [🛒 Add to Cart]                     │
│ [Buy Now →] (goes directly to cart)  │
└──────────────────────────────────────┘
```

**Subscription plan selection:**
- Show available `recurring_plans` as radio group (pill style): Monthly | Weekly | Yearly | Daily | One-time
- When a plan is selected:
  - Update "per X" text under price
  - Set `plan_id` in cart item
  - Auto-calculate and show `End Date` = start_date + billing_period duration
  - Show the computed date range: "Apr 5, 2026 → May 5, 2026"
- Start date: date picker (default = today, min = today)
- Store `billing_period` and `start_date` in the Zustand cart store (global for session)

**Important:** When adding to cart:
1. Set `plan_id` on the cart item (from selected plan)
2. Set global `billing_period` on cart store
3. Set global `start_date` on cart store
4. Toast: "Added! Your subscription starts Apr 5 and renews monthly."

---

### 4. `/cart` — Cart & Checkout

**Goal:** Full checkout experience with subscription confirmation, billing period, pricing breakdown.

#### Layout: 2-column (items left, summary right)

**Left — Cart Items**

Each item card shows:
- Product name + variant (if any)
- Plan badge: "Monthly Plan" / "One-time" (indigo pill)
- Unit price × quantity = line total
- Quantity stepper (-, qty, +) — min 1
- Remove button (TrashIcon)

**Subscription Configuration Section** (below item list, inside a Card):

```
┌─────────────────────────────────────┐
│ 📅 Subscription Configuration       │
│                                      │
│ Billing Period:                      │
│ [Monthly ▾]  (dropdown: daily/      │
│               weekly/monthly/yearly) │
│                                      │
│ Start Date: [Apr 5, 2026 ▾]         │
│ End Date:   May 5, 2026 (auto)      │
│                                      │
│ ℹ️  Your subscription will auto-     │
│     renew on May 5, 2026 unless     │
│     cancelled.                       │
└─────────────────────────────────────┘
```

- Billing period select: `daily | weekly | monthly | yearly`
- Start date: date picker (shadcn Calendar in Popover), default today
- End date: auto-computed, displayed as read-only text
- If cart has a plan with `billing_period` set → pre-fill from plan

**Promo Code / Discount Section:**
```
[Enter promo code ________] [Apply]
```
- Send `GET /api/discounts?active=true` and match by name client-side, or just show the field and pass `discount_code` in fromCart body (backend can handle optionally)
- Show success: "✅ SAVE10 applied — 10% off" in green
- Show error: "❌ Invalid or expired code"

**Right — Order Summary Card (sticky)**

```
┌──────────────────────────────────┐
│ Order Summary                    │
│                                  │
│ Premium Plan × 1    ₹2,499       │
│ Support Add-on × 2  ₹1,200       │
│ ──────────────────────────────   │
│ Subtotal            ₹3,699       │
│ Tax (18% GST)       ₹  666       │  (computed from product's tax_id)
│ Discount (SAVE10)  -₹  370       │
│ ──────────────────────────────   │
│ Total               ₹3,995       │
│                                  │
│ Billing: Monthly                 │
│ Period: Apr 5 – May 5, 2026      │
│                                  │
│ [Proceed to Checkout →]          │
│                                  │
│ 🔒 Secure checkout               │
└──────────────────────────────────┘
```

**Checkout button behavior:**
1. Validate: cart not empty + billing_period selected
2. Show a confirmation dialog before placing:
   ```
   ⚠️ Confirm Order
   You are about to subscribe to 2 products.
   Billing: Monthly · ₹3,995/month
   Start: Apr 5, 2026
   [Cancel]  [Confirm & Place Order]
   ```
3. Call `POST /api/subscriptions/from-cart` with:
   ```json
   {
     "items": [...],
     "billing_period": "monthly",
     "start_date": "2026-04-05",
     "plan_id": "uuid-or-null",
     "notes": ""
   }
   ```
4. On success: clear cart → toast "Order placed!" → redirect to `/orders/:id`
5. On failure: show error toast, keep cart intact

---

### 5. `/orders` — My Subscriptions / Orders

**Goal:** Rich subscription management page with filters and subscription health indicators.

#### Features

**a) Page header**
- Title "My Subscriptions", subtitle count: "3 active · 1 paused · 2 expired"

**b) Status filter tabs (horizontal)**
- All | Active | Paused | Expired | Cancelled

**c) Subscription Cards (not a plain table — use cards)**

Each card:
```
┌────────────────────────────────────────────────────────┐
│ SUB-2026-00003          [● Active]              [›]    │
│ Premium Cloud Plan · Monthly                           │
│                                                        │
│ ████████████████░░░░░░ 60%                             │
│ 18 of 30 days used · Expires May 5, 2026              │
│                                                        │
│ 3 products · ₹4,999/mo    [View Details] [Pay Invoice] │
└────────────────────────────────────────────────────────┘
```

- Subscription number (bold) + status badge
- Plan name + billing period pill
- Progress bar: days elapsed / total period days → percentage fill
- "X of Y days used · Expires DATE"
- Line count + total amount
- Actions: "View Details" → `/orders/:id`, "Pay Invoice" → `/my-invoices` filtered

**d) Expiry warnings:**
- < 7 days: amber progress bar + "Expiring soon" chip
- Expired: red progress bar full + "Renew" button

**e) Framer Motion row stagger**
**f) Skeleton loading** — 4 card-shaped skeletons
**g) Empty state** — ZapIcon + "No subscriptions yet" + "Browse Shop" CTA

---

### 6. `/orders/[orderId]` — Order / Subscription Detail

**Goal:** Complete subscription detail page with full product list, linked invoices, payment history, and user actions.

#### Layout

**Header:**
- Back link "← My Orders"
- Subscription number (h1) + status badge
- Plan name + billing period badge

**Info Grid (2×2):**
```
Start Date         End / Expiry Date
Plan               Billing Period
Payment Terms      Created Date
Notes (if any)
```

**Products / Lines Card:**
```
┌─────────────────────────────────────────────────────┐
│ Subscribed Products                                  │
│                                                      │
│ Premium Plan    Qty: 1   ₹2,499   ₹2,499            │
│ Support Add-on  Qty: 2   ₹600     ₹1,200            │
│                                     ─────────       │
│                          Subtotal   ₹3,699           │
└─────────────────────────────────────────────────────┘
```

**Timeline / Progress Card:**
```
Subscription Timeline
[Apr 5, 2026]──────────[●Today: Apr 23]──────────[May 5, 2026]
  Start                  18 days used               End
```
- Visual progress bar (60% fill)
- Days remaining: "12 days remaining"
- If status = active + expiry < 7d → amber warning

**Linked Invoices Card:**
- Fetch `GET /api/invoices?subscription_id=:id&limit=10`
- Table: Invoice # | Date | Amount | Status | Action
- Action: "Pay Now" (if status = confirmed) → links to `/my-invoices/:id`
- Empty state: "No invoices generated yet"

**Payment History Card:**
- Fetch `GET /api/payments?subscription_id=:id&limit=10`
- Table: Date | Method | Amount | Status
- Show payment method icon: 💳 Razorpay | 🏦 Bank Transfer | 💰 Cash | etc.

**Action Buttons (bottom):**
- Active subscription: no user actions (admin manages pause/cancel)
- Expired: **[🔄 Renew Subscription]** button → opens renewal dialog
- All states: **[📄 View All Invoices]** → `/my-invoices`
- **[💬 Contact Support]** → opens support dialog

**Renewal Dialog:**
```
┌──────────────────────────────────────┐
│ 🔄 Renew Subscription                 │
│                                      │
│ SUB-2026-00003 has expired.          │
│                                      │
│ Choose new billing period:           │
│ ○ Monthly (+₹2,499)                  │
│ ○ Quarterly (+₹6,999 — save 7%)     │  (if applicable)
│ ○ Yearly (+₹24,999 — save 15%)      │
│                                      │
│ New Start Date: [Today, Apr 5 2026]  │
│ New End Date:   May 5, 2026 (auto)   │
│                                      │
│ [Cancel]   [Renew & Checkout →]      │
└──────────────────────────────────────┘
```
Renewal action: adds current subscription's products to cart with new billing period → redirects to `/cart`.

**Support Dialog:**
```
┌──────────────────────────────────────┐
│ 💬 Contact Support                    │
│                                      │
│ Subject: [____________]              │
│ Message: [________________]          │
│          [________________]          │
│                                      │
│ [Send Message]                       │
└──────────────────────────────────────┘
```
Sends to `POST /api/support` (create this endpoint if not exists, or `mailto:` fallback).

---

### 7. `/my-invoices` — Invoice List

**Goal:** Clean invoice list with status filtering, search, and quick pay.

#### Features

**a) Page header + total outstanding**
- "My Invoices" title
- Info chip: "₹12,500 outstanding across 2 invoices"

**b) Status filter tabs:**
- All | Paid | Pending | Overdue | Cancelled

**c) Invoice rows (cards)**

Each card:
```
┌──────────────────────────────────────────────────────┐
│ INV-2026-00003      ● Pending     ₹4,999             │
│ Issued Apr 1, 2026 · Due Apr 15, 2026                │
│ Subscription: SUB-2026-00003                         │
│                              [View Details] [Pay Now] │
└──────────────────────────────────────────────────────┘
```

- Invoice number + status badge
- Issued date + due date
- Grand total (bold, right-aligned)
- Linked subscription number (click → `/orders/:sub_id`)
- If status = `confirmed` or `overdue`: show **[Pay ₹X]** button (indigo)
- If status = `overdue`: show red "X days overdue" chip
- If status = `paid`: show green check icon

**d) Summary row at bottom:**
- "Showing 8 invoices · Total paid: ₹28,000 · Outstanding: ₹12,500"

**e) Framer Motion stagger + skeleton loading**

---

### 8. `/my-invoices/[id]` — Invoice Detail + Payment

**Goal:** Full invoice view with print layout, payment options, and payment history.

#### Sections

**a) Invoice Header**
- Back link + Invoice number (h1) + status badge
- Company header block (admin company info at top, customer info below) — styled like a real invoice
- "Download PDF" button (uses browser print API: `window.print()` with `@media print` CSS)

**b) Invoice Table (styled)**
```
┌──────────────────────────────────────────────────────┐
│ # │ Description     │ Qty │ Unit Price │ Tax │ Total  │
│ 1 │ Premium Plan    │  1  │ ₹2,499     │ 18% │ ₹2,949 │
│ 2 │ Support Add-on  │  2  │ ₹  600     │ 18% │ ₹1,416 │
│   │                 │     │            │     │        │
│   │            Subtotal              │         ₹3,099 │
│   │            Tax (GST 18%)         │         +₹ 666 │
│   │            Discount              │         -₹   0 │
│   │            Grand Total           │         ₹4,365 │
└──────────────────────────────────────────────────────┘
```

**c) Payment Status Card**
- Amount paid (green)
- Amount outstanding (red, bold)
- If outstanding > 0 + status = confirmed/overdue:
  - **Razorpay button:** `Pay ₹X via Razorpay` → opens Razorpay modal
  - After success: refresh invoice, show "✅ Payment received!" toast
- If fully paid: show green "✅ Fully Paid" banner

**d) Payment History Table**
- Fetch `GET /api/payments?invoice_id_filter` (or derive from invoice data)
- Show: Date | Method | Amount | Ref # | Status
- Empty state: "No payments recorded"

**e) Print / Download:**
- "🖨️ Print Invoice" button → `window.print()`
- Add `@media print` styles (hide nav, buttons, sidebar — show only invoice content)
- "📥 Download PDF" → uses `html2canvas` + `jspdf` (already installed) to capture invoice card and download as `INV-2026-00003.pdf`

---

### 9. `/profile` — My Profile (merge with `/my-account`)

**Goal:** Single comprehensive account settings page. Remove duplication between `/profile` and `/my-account`. Keep only `/my-account` and redirect `/profile` → `/my-account`.

#### Tabs layout (use shadcn `<Tabs>`)

**Tab 1: Personal Info**
- Avatar circle with initials + "Change Photo" (file upload → Cloudinary if configured, else skip image upload)
- Full name, email (disabled), phone
- Role badge (portal)
- Email verification status badge

**Tab 2: Business Info**
- Company name, GSTIN
- Full address: street, city, state, country, postal code
- This maps to the `customers` table record

**Tab 3: Security**
- Change password form: current password + new password + confirm
- Password strength indicator
- "Last login" info if available

**Tab 4: Danger Zone**
- "Delete Account" — show warning dialog, then send `DELETE /api/auth/account` (add this endpoint or just show a "Contact support to delete" message)

---

### 10. New Page: `/notifications` (add to PortalNav)

**Goal:** Notification center for the user.

**Notification types:**
- Invoice issued: "📄 Invoice INV-2026-00003 (₹4,999) has been issued. Due Apr 15."
- Invoice overdue: "🔴 Invoice INV-2026-00002 is 5 days overdue. Pay now."
- Subscription expiring: "⚠️ SUB-2026-00003 expires in 4 days. Renew now."
- Payment confirmed: "✅ Payment of ₹4,999 received for INV-2026-00003."
- Subscription activated: "🟢 Your subscription SUB-2026-00003 is now active."

**Implementation:**
- Since there's no realtime backend, generate notifications client-side by querying:
  - Overdue invoices (status = `overdue`)
  - Expiring subscriptions (expiry within 7 days)
  - Confirmed invoices pending payment
  - Recent payments (last 5)
- Store "read" notification IDs in `localStorage`
- Show unread count badge on bell icon in PortalNav
- Mark all as read button

**PortalNav change:** Add bell icon `<BellIcon>` with unread count badge next to the cart icon.

---

### 11. Update `PortalNav`

Add these links and icons:
```
Home | Shop | My Orders | Invoices | [🔔 Bell with badge] | [🛒 Cart badge] | [Avatar ▾]
```

Avatar dropdown:
- Name + email
- My Account
- Notifications
- ─────
- Sign out (red)

---

## UI / UX Standards for All Pages

### Animations (Framer Motion)
```tsx
// Page entry
<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

// List item stagger
variants={{ hidden: { opacity: 0, y: 12 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05 } }) }}
```

### Skeleton Loading
- Every page: show skeletons (pulse animation) while loading
- Cards: `<div className="h-28 rounded-xl bg-slate-100 animate-pulse" />`
- KPI cards: 4 skeleton blocks

### Empty States
- Use relevant icon (from lucide-react), h3 heading, description text, optional CTA button
- Never show a blank white page

### Error Handling
- API errors: `toast.error(e?.response?.data?.error || 'Something went wrong')`
- 404 errors: redirect back with toast
- Network errors: "Failed to connect. Check your connection."

### Status Badges
- Use existing `<StatusBadge status={...} type="subscription"|"invoice" />` component from `src/components/shared/StatusBadge.tsx`

### Dates
- Use `new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })` for Indian locale
- For relative time: "3 days ago", "in 5 days" — use manual diff, not a library

### Currency
- `₹${amount.toLocaleString('en-IN')}` — Indian number formatting (1,00,000 style)

### Responsive
- All pages must work on mobile (sm breakpoint)
- PortalNav: on mobile, collapse nav links into hamburger menu or scroll horizontally

---

## RUFLOW Pattern (Required on every page file)

Add this JSDoc comment block at the top of every page file (inside the function, before return):

```tsx
/**
 * @module portal/home
 * @api-calls GET /api/subscriptions/my, GET /api/invoices/my
 * @depends-on useSubscriptions, useInvoices, useAuth
 * @role portal
 * @emits none
 * RUFLOW_REVIEW: portal dashboard - shows KPIs, active subs, invoices due
 */
```

---

## Summary of All Files to Create / Modify

### Modify (enhance existing):
1. `src/stores/cart.ts` — add `billing_period`, `start_date`, setters
2. `src/app/(portal)/home/page.tsx` — full rebuild as specified
3. `src/app/(portal)/shop/page.tsx` — add image, type filter, sort, "in cart" indicator
4. `src/app/(portal)/shop/[productId]/page.tsx` — add plan radio + start/end date calc
5. `src/app/(portal)/cart/page.tsx` — add billing config + promo + confirm dialog
6. `src/app/(portal)/orders/page.tsx` — add status tabs + progress bar cards
7. `src/app/(portal)/orders/[orderId]/page.tsx` — add linked invoices + timeline + actions
8. `src/app/(portal)/my-invoices/page.tsx` — add status tabs + outstanding total + pay button
9. `src/app/(portal)/my-invoices/[id]/page.tsx` — add PDF download + payment history
10. `src/app/(portal)/my-account/page.tsx` — full rebuild with 4 tabs
11. `src/components/layout/PortalNav.tsx` — add bell icon + notifications link

### Create (new files):
12. `src/app/(portal)/notifications/page.tsx` — notification center
13. `src/app/(portal)/profile/page.tsx` — redirect to `/my-account` (or merge)

### Backend modification:
14. `backend/controllers/subscriptionController.js` → update `fromCart` to accept `billing_period`, `start_date`, compute and store `expiration_date`, set `status='active'`

---

## Implementation Order

1. Backend: update `fromCart` controller first (everything depends on it)
2. Cart store: add `billing_period` + `start_date`
3. Product detail page: billing period selection + date calc
4. Cart page: billing config card + confirmation dialog
5. Home page: KPI cards + subscription health
6. Orders page: status tabs + progress cards
7. Order detail: timeline + linked invoices + renewal dialog
8. Invoices page: status tabs + outstanding summary
9. Invoice detail: PDF download + payment history
10. My Account: 4-tab layout
11. Notifications page + PortalNav bell icon
12. Final pass: animations, skeletons, mobile responsiveness

---

## Key Constraints

- **No empty string values in Radix UI `<SelectItem>`** — always use `value="__none__"` sentinel
- **TypeScript build errors suppressed** in `next.config.js` (`ignoreBuildErrors: true`) — use `as unknown as` casts freely
- **Background agents cannot use Bash** — all files must be written with the `Write` tool directly
- **Auth tokens**: access token in memory (Zustand), refresh token in `localStorage` key `prosubx_refresh_token`
- **Portal role guard**: every page is inside `(portal)/layout.tsx` which already wraps with `<AuthGuard allowedRoles={['portal']}>`
- **Seed users**: portal users from `seed_data.sql` — emails like `portal1@example.com` through `portal10@example.com`, all password `Portal@1234`
