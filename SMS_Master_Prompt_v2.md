# 🧠 MASTER PROMPT v2 — Subscription Management System
## Next.js Frontend | shadcn/ui | Tailwind CSS | Backend-Aligned

> **Backend:** Express.js · PostgreSQL · Razorpay · JWT (15m access / 7d refresh)
> **Base URL:** `http://localhost:5000`
> **Subscription IDs:** `SUB-2024-00001` · **Invoice IDs:** `INV-2024-00001` (DB trigger generated — never set from frontend)

---

## ⚙️ SKILL ACTIVATION — MANDATORY PROCESS

> Execute these skills in order before writing any code. Do not skip.

### 1. 🎨 Frontend Design Skill
- **Aesthetic direction:** Refined utilitarian-luxury — B2B SaaS, not consumer app.
- **Palette:** Sidebar `#0F0F11`, content area `#F8FAFC`, accent `#6366F1` (Indigo-500), success `#22C55E`, danger `#EF4444`, warning `#F59E0B`, muted `#94A3B8`.
- **Typography:** `Geist` (all UI text) + `Bricolage Grotesque` (page headings only). No Inter, no Roboto, no system fonts.
- **Motion:** Staggered page entry (`animation-delay`), smooth sidebar collapse, skeleton-to-content crossfade, row hover lifts on tables.
- **Spatial rule:** 24px page padding, 16px card padding, 8px gap between form fields.
- Every page must feel like one cohesive product — same tokens, same icon set (Lucide React), same radius (`rounded-lg` cards, `rounded-md` inputs/badges).

### 2. 🖥️ UI/UX Intelligence
- Map every API field to a UI element before building. No orphaned fields, no missing fields.
- Apply **progressive disclosure**: show/hide fields contextually (e.g., `end_date` only when plan has one, `gstin` only in customer billing section).
- Every data-fetch screen needs: search, filter, sort, pagination (`page` + `limit` from API `pagination` envelope).
- Every form needs: Zod schema that mirrors DB constraints exactly, inline field errors from `response.details[]`, Cmd+S shortcut, Esc to cancel/close.
- Loading: `<Skeleton>` on every async component — no spinners alone.
- Empty state: illustration + contextual CTA per page.
- Toast on every mutation success/error. Pull message from `response.message`.

### 3. 🧩 shadcn/ui — Required Components Per Screen
| Component | Used In |
|-----------|---------|
| `DataTable` (TanStack) | All list views — subscriptions, products, invoices, payments, users |
| `Form` + React Hook Form + Zod | All create/edit forms |
| `Dialog` | Confirm delete, confirm status change, manual payment |
| `Sheet` | Portal preview slide-over on subscription form |
| `Command` | Cmd+K global search palette |
| `Tabs` | Subscription form (Details / Order Lines / History) |
| `Badge` | Status everywhere |
| `Combobox` (Popover + Command) | Customer search, product search on order lines |
| `DatePicker` (Calendar + Popover) | start_date, expiration_date, due_date |
| `Select` | billing_period, product_type, payment_method, plan |
| `Switch` | auto_close, closable, pausable, renewable on plan form |
| `Sonner` (Toast) | All API response feedback |
| `Skeleton` | All loading states |

### 4. 🔀 Radix UI Accessibility
- Preserve all `aria-*` and `role` attributes from shadcn components.
- Focus trap in all `<Dialog>` and `<Sheet>`.
- Keyboard navigation: Tab through form fields, Enter to submit, Esc to close.
- `<NavigationMenu>` (Radix) for portal top nav.

### 5. 📊 Ruflow Code Review Graph
Add to the top of every page/component file:
```ts
/**
 * @module [ModuleName]
 * @api-calls [list of API endpoints this component calls]
 * @depends-on [hooks and components consumed]
 * @role [admin | internal | portal | public]
 * @emits [events or state changes triggered]
 */

/* RUFLOW_REVIEW
 * Complexity: LOW | MEDIUM | HIGH
 * Business Logic: [what rules live here]
 * Edge Cases: [list known edge cases]
 * Test Priority: LOW | MEDIUM | CRITICAL
 */
```

---

## 🏗️ PROJECT SETUP

```bash
npx create-next-app@latest sms-frontend \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd sms-frontend
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge input label select \
  dialog sheet table form tabs separator skeleton sonner \
  dropdown-menu command popover calendar switch textarea \
  avatar tooltip progress

npm install lucide-react @tanstack/react-table react-hook-form zod \
  @hookform/resolvers date-fns axios razorpay
npm install -D @types/razorpay
```

### Environment Variables (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

---

## 📁 FOLDER STRUCTURE

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx          ← GET /api/auth/verify-email?token=
│   │   ├── set-password/page.tsx          ← POST /api/auth/accept-invite (internal user invite)
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx        ← POST /api/auth/reset-password
│   │
│   ├── (dashboard)/                       ← Admin + Internal layout
│   │   ├── layout.tsx                     ← Sidebar + TopNav + auth guard
│   │   ├── dashboard/page.tsx             ← GET /api/reports/dashboard
│   │   ├── subscriptions/
│   │   │   ├── page.tsx                   ← GET /api/subscriptions
│   │   │   ├── new/page.tsx               ← POST /api/subscriptions
│   │   │   └── [id]/page.tsx              ← GET/PUT/PATCH /api/subscriptions/:id
│   │   ├── products/
│   │   │   ├── page.tsx                   ← GET /api/products
│   │   │   ├── new/page.tsx               ← POST /api/products
│   │   │   └── [id]/page.tsx              ← GET/PUT /api/products/:id
│   │   ├── invoices/
│   │   │   ├── page.tsx                   ← GET /api/invoices
│   │   │   └── [id]/page.tsx              ← GET /api/invoices/:id
│   │   ├── payments/
│   │   │   └── page.tsx                   ← GET /api/payments
│   │   ├── reports/
│   │   │   └── page.tsx                   ← GET /api/reports/*
│   │   ├── users/
│   │   │   └── page.tsx                   ← GET /api/auth/me + internal users (Admin only)
│   │   └── configuration/
│   │       ├── recurring-plans/page.tsx   ← GET/POST/PUT /api/plans
│   │       ├── quotation-templates/page.tsx ← GET/POST/PUT /api/templates
│   │       ├── discounts/page.tsx         ← GET/POST/PUT /api/discounts (Admin only)
│   │       └── taxes/page.tsx             ← GET/POST/PUT /api/taxes (Admin only)
│   │
│   └── (portal)/                          ← Customer-facing layout
│       ├── layout.tsx                     ← Portal nav + portal auth guard
│       ├── home/page.tsx
│       ├── shop/
│       │   ├── page.tsx                   ← GET /api/products?is_active=true
│       │   └── [productId]/page.tsx       ← GET /api/products/:id + variants
│       ├── cart/page.tsx                  ← Client-side cart (localStorage)
│       ├── orders/
│       │   ├── page.tsx                   ← GET /api/subscriptions/my
│       │   └── [orderId]/page.tsx         ← GET /api/subscriptions/:id + invoices
│       ├── invoices/
│       │   └── [invoiceId]/page.tsx       ← GET /api/invoices/:id + payment flow
│       └── profile/page.tsx               ← GET/PUT /api/auth/me + customer profile
│
├── components/
│   ├── ui/                                ← shadcn auto-generated
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   ├── CommandPalette.tsx             ← Cmd+K global search
│   │   └── PortalNav.tsx
│   ├── auth/
│   │   └── AuthGuard.tsx                 ← Wraps dashboard + portal layouts
│   ├── subscriptions/
│   │   ├── SubscriptionTable.tsx
│   │   ├── SubscriptionForm.tsx
│   │   ├── OrderLinesTab.tsx
│   │   ├── HistoryTab.tsx
│   │   ├── StatusActionBar.tsx           ← State machine buttons
│   │   └── PortalPreviewSheet.tsx
│   ├── products/
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   └── VariantsTab.tsx
│   ├── invoices/
│   │   ├── InvoiceTable.tsx
│   │   └── InvoiceDetail.tsx
│   ├── payments/
│   │   ├── RazorpayButton.tsx            ← Opens Razorpay checkout popup
│   │   └── ManualPaymentDialog.tsx
│   ├── reports/
│   │   ├── KPICards.tsx
│   │   ├── RevenueChart.tsx
│   │   └── OverdueTable.tsx
│   └── shared/
│       ├── DataTable.tsx                 ← Reusable TanStack wrapper
│       ├── PageHeader.tsx
│       ├── EmptyState.tsx
│       ├── StatusBadge.tsx
│       ├── ConfirmDialog.tsx
│       └── PaginationControls.tsx
│
├── hooks/
│   ├── useAuth.ts                        ← Auth state, login, logout, role check
│   ├── useApi.ts                         ← Axios instance with token refresh interceptor
│   ├── useSubscriptions.ts
│   ├── useProducts.ts
│   ├── useInvoices.ts
│   ├── usePlans.ts
│   ├── useTemplates.ts
│   ├── useDiscounts.ts
│   ├── useTaxes.ts
│   ├── usePayments.ts
│   └── useReports.ts
│
├── lib/
│   ├── api.ts                            ← Axios instance + interceptors
│   ├── auth.ts                           ← Token storage (httpOnly cookie strategy)
│   ├── razorpay.ts                       ← Razorpay checkout loader util
│   └── utils.ts                          ← cn(), formatINR(), formatDate()
│
├── types/
│   └── index.ts                          ← All TypeScript interfaces
│
└── stores/
    └── cart.ts                           ← Zustand cart store (portal)
```

---

## 🌐 API SERVICE LAYER

### `lib/api.ts` — Axios Instance with Token Refresh
```ts
// Access token: 15 minutes. Refresh token: 7 days.
// On 401 → call POST /api/auth/refresh-token → retry original request once.
// On second 401 → clear tokens → redirect to /login.

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  const token = getAccessToken(); // from memory/cookie
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await axios.post('/api/auth/refresh-token', { refreshToken: getRefreshToken() });
      setAccessToken(data.data.accessToken);
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Standard Response Handler
```ts
// Backend always returns:
// Success: { success: true, message: string, data: T }
// List:    { success: true, data: T[], pagination: { page, limit, total, pages } }
// Error:   { success: false, error: string, details: [{ field, message }] }

function handleApiError(err: AxiosError, form?: UseFormReturn) {
  const res = err.response?.data as ApiError;
  if (form && res.details) {
    res.details.forEach(({ field, message }) => form.setError(field as any, { message }));
  }
  toast.error(res.error || 'Something went wrong');
}
```

---

## 🔐 AUTH MODULE

### Token Storage Strategy
- **Access token (15m):** Store in memory (React context/Zustand). Never in localStorage.
- **Refresh token (7d):** Store in `httpOnly` cookie (set via `Set-Cookie` response header from backend) OR in memory with silent refresh.

### Pages & Flows

#### `/login` — All Roles
**API:** `POST /api/auth/login` → `{ email, password }`
**Response:** `{ success, data: { accessToken, refreshToken, user: { id, name, email, role } } }`
**Blocks login if:** `is_active=false` / `invite not accepted` / `email unverified` — show exact message from `error` field.
**After login:** Check `user.role` → redirect:
- `admin` or `internal` → `/dashboard`
- `portal` → `/home`

**Fields:**
- Email (`type="email"`)
- Password (toggle visibility)
- `Login` button (primary, full-width)
- `Forgot password?` → `/forgot-password`
- `Don't have an account? Sign up` → `/signup`

> ⚠️ No "Sign in with Google" — backend does not support OAuth.

---

#### `/signup` — Portal Customers Only
**API:** `POST /api/auth/signup` → `{ name, email, password }`
**Zod schema:**
```ts
z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
})
```
**On success:** Show banner: "Check your email to verify your account." Do not auto-login — email verification required first.

> ⚠️ This creates a **Portal user** only. Admin is seeded via SQL. Internal users are invited by Admin.

---

#### `/verify-email` — Portal Customers
**Triggered by:** Clicking link in verification email → `APP_URL/verify-email?token=<TOKEN>`
**API:** `GET /api/auth/verify-email?token=<TOKEN_FROM_URL>`
**On success:** Show "Email verified! You can now log in." → redirect to `/login` after 3s.
**On failure:** Show "This link has expired or is invalid. Please sign up again."

---

#### `/set-password` — Internal Users (Accept Invite)
**Triggered by:** Admin invite email → `APP_URL/set-password?token=<TOKEN>`
**API:** `POST /api/auth/accept-invite` → `{ token, password }`
**Fields:** New password + Confirm password (same Zod strength rules as signup)
**On success:** Return JWT → redirect to `/dashboard`. Internal user is now logged in.
**On failure:** "This invitation has expired (48h limit). Ask your admin to resend."
**Resend invite (admin action):** `POST /api/auth/resend-invite` → `{ user_id }`

---

#### `/forgot-password`
**API:** `POST /api/auth/forgot-password` → `{ email }`
**Always returns HTTP 200** (prevents email enumeration — never reveal if email exists).
**UI:** Always show: "If that email exists, we've sent a reset link." regardless of outcome.

---

#### `/reset-password`
**Triggered by:** Reset email link → `APP_URL/reset-password?token=<TOKEN>`
**API:** `POST /api/auth/reset-password` → `{ token, password }`
**Token TTL: 1 hour** — show clear expired state.

---

## 🏠 DASHBOARD LAYOUT (Admin + Internal)

### Sidebar
```
[Brand Logo + Name]
──────────────────
📋  Subscriptions
📦  Products
🧾  Invoices
💳  Payments
📊  Reports
👥  Users / Contacts
⚙️  Configuration
    ├ Recurring Plans
    ├ Quotation Templates
    ├ Discounts         [Admin only — hide for Internal]
    └ Taxes             [Admin only — hide for Internal]
──────────────────
👤  My Profile
```
- Active item: `bg-indigo-500/10 border-l-2 border-indigo-500 text-indigo-400`
- Sidebar collapses to icon-only on mobile
- Background: `#0F0F11`, text: `#94A3B8`
- Role-gated items: render `null` (not just hidden) for unauthorized roles

### Top Navigation
- Cmd+K → `<Command>` palette (global search across subscriptions, invoices, products)
- `GET /api/auth/me` → populate avatar + name in user dropdown
- User dropdown: My Profile, Logout

---

## 📋 SUBSCRIPTIONS MODULE

### List View `/subscriptions`
**API:** `GET /api/subscriptions?status=&customer=&plan=&page=&limit=20`
**Response pagination:** Use `pagination.pages` for page controls.

**Filters:** Status (`<Select>`), Plan (`<Select>` from `/api/plans`), search (customer name)

**Table Columns:**
| Column | Field | Notes |
|--------|-------|-------|
| Number | `subscription_number` | `SUB-2024-00001` format — clickable |
| Customer | `customer.name` | From join |
| Plan | `plan.name` | |
| Next Invoice | `start_date` derived | |
| Recurring | `plan.price` | Format as ₹ |
| Status | `status` | `<StatusBadge>` |
| Created | `created_at` | |

**Actions:** Row click → `/subscriptions/[id]`

---

### Form View `/subscriptions/new` + `/subscriptions/[id]`

#### API Calls This Page Makes:
```
GET  /api/subscriptions/:id          ← load existing
POST /api/subscriptions              ← create new
PUT  /api/subscriptions/:id          ← update (only draft/quotation)
PATCH /api/subscriptions/:id/status  ← lifecycle transitions
POST /api/subscriptions/:id/lines    ← add order line
PUT  /api/subscriptions/:id/lines/:lid  ← edit line
DELETE /api/subscriptions/:id/lines/:lid ← remove line
POST /api/subscriptions/:id/invoice  ← generate invoice
GET  /api/plans                      ← plan dropdown
GET  /api/templates                  ← template dropdown
GET  /api/taxes                      ← tax multi-select on lines
GET  /api/discounts                  ← discount per line
```

#### Subscription Status Machine
```
draft → quotation → confirmed → active → closed
```
| Current Status | Available Actions |
|----------------|------------------|
| `draft` | `Send` (→ quotation) |
| `quotation` | `Confirm` (→ confirmed), `Cancel` (→ draft) |
| `confirmed` | `Create Invoice`, `Close` (→ closed) |
| `active` | `Create Invoice`, `Close` (→ closed) |
| `closed` | No actions — read-only |

> ⚠️ `PATCH /api/subscriptions/:id/status` body: `{ status: 'quotation' | 'confirmed' | 'active' | 'closed' }`

> ⚠️ `PUT /api/subscriptions/:id` is **blocked by backend** if status is `confirmed` / `active` / `closed`. Show locked banner: "This subscription is confirmed. No edits allowed."

#### Header Fields (2-column grid):

| Left Column | API Field | Notes |
|-------------|-----------|-------|
| Subscription Number | `subscription_number` | Read-only — DB trigger generates `SUB-YYYY-NNNNN`. Never allow user input |
| Customer | `customer_id` | Combobox — search by name. Start typing → fetch customers. If not found → "Create new customer" CTA |
| Quotation Template | `template_id` | `<Select>` from `/api/templates`. On select → auto-fill order lines |
| Order Date | `start_date` | `<DatePicker>` |

| Right Column | API Field | Notes |
|--------------|-----------|-------|
| Recurring Plan | `plan_id` | `<Select>` from `/api/plans` |
| Expiration Date | `expiration_date` | `<DatePicker>`. Tooltip: "Quotation expires after this date — customer cannot pay after this" |
| Payment Terms | `payment_terms` | Text input (e.g. "Net 30", "Due on receipt") |
| Notes | `notes` | `<Textarea>` — internal notes only |

#### Order Lines Tab

Table columns:
| Column | Field | Notes |
|--------|-------|-------|
| Product | `product_id` | Combobox — search active products |
| Variant | `variant_id` | Appears only after product selected. Fetch `GET /api/products/:id/variants` |
| Qty | `quantity` | Integer input ≥ 1 |
| Unit Price | `unit_price` | Auto-fills from `product.sales_price + variant.extra_price`. Editable |
| Taxes | `tax_ids[]` | Multi-select from `/api/taxes`. Shows tax names as chips |
| Discount | `discount_id` | `<Select>` from `/api/discounts`. Shows computed `discount_amount` |
| Tax Amount | `tax_amount` | Computed, read-only |
| Discount Amount | `discount_amount` | Computed, read-only |
| Total | `total_amount` | `(unit_price × qty) + tax_amount − discount_amount`. Read-only |
| — | Delete button | Calls `DELETE /api/subscriptions/:id/lines/:lid` |

Footer: Subtotal | Tax Total | Discount Total | **Grand Total**

`+ Add Line` button → calls `POST /api/subscriptions/:id/lines`

> ⚠️ When status is `confirmed`/`active`/`closed` → entire order lines table is **read-only**. Show lock icon on tab header.

#### History Tab
Shows sibling subscriptions (renew/upsell created from this subscription). Fetch via `GET /api/subscriptions?parent_id=:id` if backend supports, otherwise embed in subscription detail response.

---

## 📦 PRODUCTS MODULE

### List View `/products`
**API:** `GET /api/products?is_active=&type=&page=&limit=20`

**Table Columns:** Name | Type | Sales Price (₹) | Cost Price (₹) | Status (Active/Inactive) | Variants (count badge)

**Actions:**
- `New` button (Admin + Internal)
- Row click → `/products/[id]`
- Toggle active: `PATCH /api/products/:id/toggle` (Admin only)
- Delete: `DELETE /api/products/:id` (Admin only) — show `<ConfirmDialog>` first

### Form View `/products/[id]`
**Fields from DB schema:**
- Name (`VARCHAR 200`, required)
- Product Type: `<Select>` → `service | physical | digital | other`
- Description (`<Textarea>`)
- Sales Price (₹, required, ≥ 0)
- Cost Price (₹, required, ≥ 0)
- Active status badge (toggle via PATCH endpoint — Admin only)

**Variants Tab:**
**API:** `GET /api/products/:id/variants`
Table: Attribute | Value | Extra Price | Active | Actions (Edit/Delete)
`+ Add Variant` → `POST /api/products/:id/variants`
- `attribute`: e.g. "Brand", "Tier"
- `value`: e.g. "Odoo", "Pro"
- `extra_price`: added on top of `sales_price`

> 💡 Pricing note: Show "Final price = ₹[sales_price + variant.extra_price]" as computed tooltip on variant row.

---

## ⚙️ CONFIGURATION MODULE

### Recurring Plans `/configuration/recurring-plans`
**API:** `GET/POST/PUT /api/plans` · `PATCH /api/plans/:id/toggle` (Admin) · `DELETE /api/plans/:id` (Admin — blocked if subscriptions linked)

**Form fields (from `recurring_plans` schema):**
| Field | Input Type | Constraint |
|-------|-----------|------------|
| name | Text | Required |
| price | Number | ≥ 0, INR |
| billing_period | RadioGroup | `daily / weekly / monthly / yearly` |
| min_quantity | Number | ≥ 1, default 1 |
| start_date | DatePicker | Optional — NULL = always available |
| end_date | DatePicker | Optional — NULL = no expiry |
| auto_close | Switch | Auto-closes sub at expiration_date |
| closable | Switch | Allow manual early close |
| pausable | Switch | Allow pause requests |
| renewable | Switch | Allow renewal |

> ⚠️ Delete blocked (HTTP 422) if subscriptions are linked. Show: "Cannot delete — this plan has active subscriptions."

---

### Quotation Templates `/configuration/quotation-templates`
**API:** `GET/POST/PUT /api/templates` + lines endpoints

**Form fields (from `quotation_templates` schema):**
- name (required)
- validity_days (integer, default 30) — shown as "Quotation valid for N days"
- recurring_plan_id (`<Select>` from `/api/plans`, optional — can be set at subscription time)

**Template Lines sub-table:**
API: `POST /api/templates/:id/lines` | `PUT /api/templates/:id/lines/:lid` | `DELETE /api/templates/:id/lines/:lid`
Columns: Product | Default Qty | Unit Price (snapshot)

---

### Discounts `/configuration/discounts`
> ⚠️ **Admin only** — hide entire menu item from Internal users. Enforced at DB level via `trg_check_discount_creator`.

**API:** `GET/POST/PUT /api/discounts` · `PATCH /api/discounts/:id/toggle` · `DELETE /api/discounts/:id`

**Form fields (from `discounts` schema):**
| Field | Input | Note |
|-------|-------|------|
| name | Text | e.g. "Q1 Startup Offer" |
| type | RadioGroup | `fixed` (₹) · `percentage` (%) |
| value | Number | > 0 |
| min_purchase | Number | Optional — minimum order value to qualify |
| min_quantity | Integer | Optional — default 1 |
| start_date | DatePicker | Optional |
| end_date | DatePicker | Optional |
| usage_limit | Integer | Optional — NULL = unlimited |
| usage_count | Read-only | Show as "Used X / Y times" |
| applies_to_products | Checkbox | |
| applies_to_subscriptions | Checkbox | |

> Delete blocked (HTTP 422) if `usage_count > 0`. Show: "Cannot delete — this discount has been applied."

#### Discount Application Logic (frontend must compute for preview):
```ts
function computeDiscount(discount, unitPrice, quantity) {
  if (discount.type === 'percentage')
    return (unitPrice * quantity) * (discount.value / 100);
  if (discount.type === 'fixed')
    return Math.min(discount.value, unitPrice * quantity);
  return 0;
}
```

---

### Taxes `/configuration/taxes`
> ⚠️ **Admin only** for create/edit/delete. Internal users can only view.

**API:** `GET/POST/PUT /api/taxes` · `PATCH /api/taxes/:id/toggle` (Admin) · `DELETE /api/taxes/:id` (Admin — blocked if in use)

**Seeded defaults:** GST 5%, GST 12%, GST 18%, GST 28% — show as pre-existing rows.

**Form fields (from `taxes` schema):**
| Field | Input | Note |
|-------|-------|------|
| name | Text | e.g. "GST 18%" |
| type | RadioGroup | `percentage` · `fixed` |
| rate | Number | Percentage: 18.00 = 18%. Fixed: rupee amount |
| description | Textarea | Optional |

---

## 🧾 INVOICES MODULE

### Invoice Status Lifecycle
```
draft → confirmed → paid
          ↓
       cancelled
```
| Status | Badge color |
|--------|-------------|
| `draft` | Gray |
| `confirmed` | Blue |
| `paid` | Green |
| `cancelled` | Red |

### List View `/invoices`
**API:** `GET /api/invoices?status=&customer=&page=&limit=20`

Table: Invoice Number (`INV-2024-00001`) | Customer | Issued Date | Due Date | Grand Total (₹) | Status

### Detail View `/invoices/[id]`
**API:** `GET /api/invoices/:id` (returns invoice + lines)
**Also call:** `GET /api/invoices/:id/payment-status` → `{ amount_paid, amount_outstanding }`

**Header section:**
- Invoice Number (read-only, `INV-YYYY-NNNNN`)
- Issued Date / Due Date / Source (subscription number)

**Customer block:**
- Customer name, email, phone, address, city, state, postal_code, GSTIN (from `customers` table)

**Line Items Table (from `invoice_lines`):**
| Column | Field |
|--------|-------|
| Description | `description` |
| Qty | `quantity` |
| Unit Price | `unit_price` |
| Tax Amount | `tax_amount` |
| Discount | `discount_amount` |
| Line Total | `line_total` |

**Footer totals (from `invoices` table):**
- Subtotal: `subtotal`
- Discount Total: `−discount_total`
- Tax Total: `+tax_total`
- **Grand Total:** `grand_total`
- Amount Paid: from payment-status endpoint
- **Amount Due:** `grand_total − amount_paid` (show in red if > 0)

**Action Bar (based on status):**
| Status | Available Actions |
|--------|-----------------|
| `draft` | `Confirm` (`PATCH /api/invoices/:id/confirm`) · `Cancel` (Admin: `PATCH /api/invoices/:id/cancel`) |
| `confirmed` | `Pay Now` (Razorpay) · `Manual Payment` (Admin/Internal) · `Cancel` (Admin) |
| `paid` | `Download PDF` · `Print` — no further actions |
| `cancelled` | Read-only |

> 💡 **Payment button visibility:** If `amount_outstanding === 0` → hide "Pay Now" button.

---

## 💳 PAYMENTS MODULE

### Razorpay Integration Flow
```
1. User clicks "Pay Now" on a confirmed invoice
2. Call: POST /api/payments/create-order { invoice_id }
   → Returns: { order_id, amount (in paise), currency: 'INR' }
3. Load Razorpay checkout script + open popup:
   { key: NEXT_PUBLIC_RAZORPAY_KEY_ID, order_id, amount, currency, prefill }
4. Customer pays → handler called with:
   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
5. Call: POST /api/payments/verify
   { order_id, payment_id, signature, invoice_id }
6. On success → invoice status → 'paid' → refresh invoice detail
```

### `lib/razorpay.ts` Utility
```ts
export function openRazorpayCheckout({ order_id, amount, currency, prefill, onSuccess, onError }) {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => {
    const rzp = new (window as any).Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount, currency, order_id,
      prefill,
      handler: onSuccess,
      modal: { ondismiss: () => toast.info('Payment cancelled') },
    });
    rzp.open();
  };
  document.body.appendChild(script);
}
```

### Manual Payment Dialog (Admin/Internal)
**API:** `POST /api/payments/manual`
**Fields:**
- `invoice_id` (pre-filled from current invoice)
- `amount` (₹)
- `payment_method`: `<Select>` → `bank_transfer | cash | other`
- `payment_date`: `<DatePicker>`
- `reference_number`: Text — cheque no. / transfer ref
- `notes`: Textarea

### Payments List `/payments`
**API:** `GET /api/payments?status=&method=&page=&limit=20`
Table: Invoice Number | Customer | Amount | Method | Date | Status (pending/success/failed)

---

## 📊 REPORTS MODULE `/reports`

### API Endpoints → UI Components

| Endpoint | Response | UI Component |
|----------|----------|-------------|
| `GET /api/reports/dashboard` | `{ active_subscriptions, monthly_revenue, overdue_invoices, pending_payments }` | 4 `<KPICard>` components at top |
| `GET /api/reports/monthly-revenue` | `[{ month, revenue }]` from `v_monthly_revenue` view | Line chart (Recharts) |
| `GET /api/reports/active-subscriptions` | `[{ subscription_number, customer_name, plan_name, billing_period, price }]` from `v_active_subscriptions` | DataTable with export |
| `GET /api/reports/invoice-summary` | `[{ invoice_number, customer, grand_total, amount_paid, amount_outstanding }]` from `v_invoice_summary` | DataTable |
| `GET /api/reports/overdue-invoices` | `[{ invoice_number, customer, due_date, days_overdue, amount }]` from `v_overdue_invoices` sorted by `days_overdue` | DataTable with red row highlight for days_overdue > 30 |
| `GET /api/reports/pending-invitations` | `[{ email, invited_by, expires_at, is_expired }]` | Admin-only table with `Resend` action |

**KPI Cards layout (2×2 grid):**
- Active Subscriptions → indigo
- Monthly Revenue (₹) → green
- Overdue Invoices → red
- Pending Payments → amber

**Charts:**
- Monthly Revenue → Recharts `<LineChart>` — X axis: month name, Y axis: ₹
- Invoice Summary → Recharts `<BarChart>` — paid vs outstanding per month

---

## 👥 USERS MODULE `/users`

### Internal User Management (Admin Only)
**API:** `POST /api/auth/internal-users` → `{ name, email }` → triggers invite email

**Invite Flow UI:**
1. Admin clicks "Invite Internal User" button
2. `<Dialog>` opens with Name + Email fields
3. On submit → `POST /api/auth/internal-users`
4. Toast: "Invite sent to email@company.com"
5. User appears in table with status `pending` (from `user_invitations`)

**Pending Invitations section (Admin only):**
- `GET /api/reports/pending-invitations` → shows name, email, invited by, expires_at, `is_expired` flag
- `Resend` button → `POST /api/auth/resend-invite { user_id }` (only when `is_expired = true`)

**Users Table Columns:** Name | Email | Role | Status (Active/Inactive) | Created | Actions

---

## 🛍️ PORTAL MODULE (Customer-Facing)

### Portal Auth Guard
- Only `role === 'portal'` users can access `/home`, `/shop`, `/orders`, `/invoices`, `/profile`
- Redirect `admin` and `internal` to `/dashboard` if they try to access portal routes

### Portal Nav
```
[Company Logo] ──── Home | Shop ──── Cart (badge) | My Account
```
Cart badge: item count from Zustand store

---

### Shop Page `/shop`
**API:** `GET /api/products?is_active=true`
**Grid:** 3-col on desktop, 2-col tablet, 1-col mobile
**Product Card:** Image placeholder | Name | Type badge | `plan.price / billing_period` | `View Product` button

---

### Product Detail `/shop/[productId]`
**APIs:**
- `GET /api/products/:id` → product details
- `GET /api/products/:id/variants` → variants list

**Variant selector:** Dropdown or pill group. On selection: computed price = `sales_price + variant.extra_price`

**Pricing table (if product has recurring plan attached):**
| Plan | Total Price | Per Month | Discount |
|------|-------------|-----------|---------|
| Monthly | ₹1,200 | ₹1,200/mo | — |
| 6 Months | ₹5,760 | ₹960/mo | 20% |
| Yearly | ₹10,080 | ₹840/mo | 30% |

Discount % computed: `(monthly_price - plan_price_per_month) / monthly_price * 100`

`Add to Cart` → saves to Zustand cart store (product_id, variant_id, plan_id, quantity)

---

### Cart Page `/cart`
**State:** Zustand store — no backend call until checkout.

**Line items:**
- Product name | `- 1 +` quantity control | Remove button
- Discount applied label: "10% off — −₹120"

**Discount code input:**
- `POST /api/discounts` with code (if backend supports code lookup — otherwise apply by ID)
- Success state: "Discount applied — −₹120"
- Error: "Invalid or expired discount code"

**Order Summary sidebar:**
- Subtotal | Discount | Taxes | **Total**
- `Checkout` button → creates subscription via `POST /api/subscriptions`

---

### My Orders `/orders` (Portal)
**API:** `GET /api/subscriptions/my`

Table: Order No. | Plan | Start Date | Status | Total | Actions (View)

---

### Order Detail `/orders/[orderId]` (Portal)
**APIs:**
- `GET /api/subscriptions/:id` → subscription detail
- `GET /api/invoices/customer/:cid` → customer invoices
- `GET /api/subscriptions/my` → filtered

**Sections:**
1. Subscription header: `SUB-2024-00001`, Start/End Date, Plan, Status badge
2. Billing address (from `customers` table: address, city, state, postal_code)
3. Last Invoices table: Invoice No. | Status | Total → click → `/invoices/[id]`
4. Actions: `Renew` (creates new subscription) | `Close` | `Download` (PDF)

> ⚠️ `Renew` calls `POST /api/subscriptions` with same lines. Show confirmation dialog first.

---

### Invoice Detail `/invoices/[invoiceId]` (Portal)
**APIs:**
- `GET /api/invoices/:id`
- `GET /api/invoices/:id/payment-status`
- `POST /api/payments/create-order` + `POST /api/payments/verify` (Razorpay flow)

**Same layout as admin invoice detail but:**
- No `Cancel` or `Confirm` buttons
- No `Manual Payment` option
- Shows `Pay Now` (Razorpay) if `amount_outstanding > 0`
- Shows `Download` + `Print` always

---

### My Profile `/profile` (Portal)
**API:**
- `GET /api/auth/me` → user name, email, role
- `GET /api/customers/:id` (if exposed) or embed in `/me` response

**Editable fields (from `customers` table):**
- Company Name, Phone, Address, City, State, Country (default India), Postal Code, GSTIN

**Non-editable:** Email (shown read-only), Role

`Save` → `PUT` to appropriate endpoint. Toast: "Profile updated."

---

## 🔒 ROLE-BASED ACCESS (EXACT BACKEND MATRIX)

| Capability | Admin | Internal | Portal |
|------------|-------|----------|--------|
| Login | ✅ | ✅ | ✅ |
| Self-register via /signup | ❌ | ❌ | ✅ |
| Create Internal User + send invite | ✅ | ❌ | ❌ |
| Resend invite | ✅ | ❌ | ❌ |
| View pending invitations | ✅ | ❌ | ❌ |
| View/Edit Products | ✅ | ✅ | ❌ |
| Toggle/Delete Products | ✅ | ❌ | ❌ |
| Create/Edit Taxes | ✅ | ❌ | ❌ |
| View Taxes | ✅ | ✅ | ❌ |
| Create/Edit Discounts | ✅ | ❌ | ❌ |
| View Discounts | ✅ | ✅ | ❌ |
| Manage Recurring Plans | ✅ | ✅ | ❌ |
| Toggle/Delete Plans (Admin) | ✅ | ❌ | ❌ |
| Manage Quotation Templates | ✅ | ✅ | ❌ |
| Create/Edit/Confirm Subscriptions | ✅ | ✅ | ❌ |
| View Own Subscriptions | ❌ | ❌ | ✅ |
| Generate/Confirm Invoices | ✅ | ✅ | ❌ |
| Cancel Invoices | ✅ | ❌ | ❌ |
| View Own Invoices | ❌ | ❌ | ✅ |
| Initiate Razorpay Payment | ✅ | ✅ | ✅ |
| Record Manual Payment | ✅ | ✅ | ❌ |
| View Reports/Dashboard | ✅ | ✅ | ❌ |

**Implementation:** `useAuth()` hook exposes `user.role`. Use `<RoleGate role="admin">` wrapper component that renders `null` for unauthorized roles.

---

## 📐 STATUS BADGE DESIGN (Exact Enums)

```ts
// Subscription status (subscription_status enum)
const subscriptionBadge = {
  draft:     'bg-slate-100 text-slate-600',
  quotation: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-violet-100 text-violet-700',
  active:    'bg-green-100 text-green-700',
  closed:    'bg-slate-200 text-slate-500',
}

// Invoice status (invoice_status enum)
const invoiceBadge = {
  draft:     'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-100 text-blue-700',
  paid:      'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

// Payment status (payment_status enum)
const paymentBadge = {
  pending: 'bg-amber-100 text-amber-700',
  success: 'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
}
```

---

## 📐 TYPESCRIPT INTERFACES (Key Types)

```ts
type UserRole = 'admin' | 'internal' | 'portal';
type BillingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed';
type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';
type PaymentStatus = 'pending' | 'success' | 'failed';
type PaymentMethod = 'razorpay' | 'bank_transfer' | 'cash' | 'other';
type DiscountType = 'fixed' | 'percentage';
type TaxType = 'percentage' | 'fixed';
type ProductType = 'service' | 'physical' | 'digital' | 'other';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { page: number; limit: number; total: number; pages: number; };
}

interface ApiError {
  success: false;
  error: string;
  details?: Array<{ field: string; message: string }>;
}
```

---

## ✅ PER-PAGE QUALITY CHECKLIST

Before marking any page complete:
- [ ] All API fields from DB schema are mapped to form inputs — no orphaned fields
- [ ] Subscription number displayed as `SUB-YYYY-NNNNN`, Invoice as `INV-YYYY-NNNNN`
- [ ] No "Sign in with Google" anywhere — removed from auth pages
- [ ] No Enum values outside the 9 defined PostgreSQL enum types
- [ ] Role guard renders `null` (not hidden) for unauthorized elements
- [ ] Token refresh interceptor handles 401 silently
- [ ] All API error `details[]` mapped to form field errors via `form.setError()`
- [ ] Toast uses `response.message` for success, `response.error` for failure
- [ ] `<Skeleton>` component during all data fetches
- [ ] Empty state with illustration + CTA
- [ ] Zod schema matches DB constraints exactly (VARCHAR lengths, min values, enums)
- [ ] Pagination implemented with `pagination.pages` from API
- [ ] `RUFLOW_REVIEW` comment block at top of file
- [ ] `@module` JSDoc comment with API endpoints listed

---

## 🚀 BUILD ORDER

| Step | Module | Notes |
|------|--------|-------|
| 1 | API service layer (`lib/api.ts` + token refresh) | Foundation — all other hooks depend on this |
| 2 | Auth pages (Login, Signup, Verify Email, Set Password, Forgot/Reset) | No portal without this |
| 3 | Dashboard layout (Sidebar, TopNav, AuthGuard) | Shell for all dashboard pages |
| 4 | Subscriptions list + form (core business module) | Highest complexity — do early |
| 5 | Products + Variants | Dependency of subscription order lines |
| 6 | Configuration (Plans → Templates → Taxes → Discounts) | Dependencies before subscriptions |
| 7 | Invoices list + detail | Downstream of subscriptions |
| 8 | Payments (Razorpay + Manual) | Downstream of invoices |
| 9 | Reports dashboard | All data already available |
| 10 | Users / invitations (Admin) | Admin-only feature |
| 11 | Portal layout + nav | Separate concern |
| 12 | Shop (list + product detail) | Portal shopping |
| 13 | Cart + Checkout | Portal checkout |
| 14 | My Orders + Order Detail | Portal post-purchase |
| 15 | Invoice view (Portal) + Razorpay | Portal payment |
| 16 | My Profile (Portal) | Portal account |

---

*SMS Frontend Master Prompt v2 — Backend-Aligned · Generated from Excalidraw + PDF Spec + Backend API README · April 2025*
