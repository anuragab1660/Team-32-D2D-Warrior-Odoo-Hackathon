# ProsubX — Admin Panel: Full Build, Fix & Enhancement Prompt

## Context

Full-stack subscription management app.
- **Stack:** Next.js 14 (App Router, TypeScript), shadcn/ui, Tailwind CSS, Framer Motion
- **Backend:** Express.js on port 5000, PostgreSQL, JWT auth
- **Primary color:** Indigo-500 `#6366f1` (`--primary: 239 84% 67%`)
- **API base:** `NEXT_PUBLIC_API_URL` → axios instance at `src/lib/api.ts`
- **Auth:** JWT access token (15 min, in-memory), refresh token (7d, localStorage key `prosubx_refresh_token`)
- **Roles enum (DB):** `admin` | `internal` | `portal`
- **Admin login:** `admin@company.com` / `Admin@1234`
- **All files are at:** `/Users/priyanshupatel/Downloads/ProsubX/frontend/src/`

---

## What You Must Do — Full Checklist

### PHASE 1 — Audit & Test Every Admin Section

Read every file under `src/app/(dashboard)/` and every hook under `src/hooks/`.
For each section, verify:
- API calls match actual backend routes (check `backend/routes/` and `backend/controllers/`)
- Data renders correctly in the table/cards
- Create/Edit/Delete flows work end-to-end
- Loading skeletons, empty states, error toasts all work
- No TypeScript errors (`mcp__ide__getDiagnostics`)

Sections to audit: dashboard, subscriptions, products, invoices, payments, reports, users, configuration/recurring-plans, configuration/quotation-templates, configuration/discounts, configuration/taxes.

---

### PHASE 2 — Fix All Broken Sections

Fix every broken section found in Phase 1. Common issues to check and fix:

1. **Wrong API endpoint paths** — verify each `api.get/post/put/patch/delete` call matches the actual backend route
2. **Missing fields in create forms** — ensure all required DB columns are in the form
3. **Pagination not working** — `PaginationControls` must pass correct page to re-fetch
4. **Edit flows missing** — if a detail page has no edit capability, add inline edit or an edit form
5. **Delete/deactivate not wired** — confirm dialog must call correct endpoint then refresh list
6. **TypeScript `unknown` casts** — replace dirty casts with proper typed API responses

---

### PHASE 3 — Internal Users (Employee) Section — ADMIN ONLY

**This is a new dedicated section.** Admin can directly create an Internal User (Employee) with email + password — no invite email, no token flow. The user is immediately active.

#### 3a. Backend changes

Add route `POST /api/users/create-internal` (admin-only) in `backend/routes/users.js` and implement in `backend/controllers/usersController.js`:

```
Body: { name, email, password }
- Validate: name required, email unique, password min 8 chars + complexity
- Hash password with bcrypt cost 12
- INSERT into users (name, email, password_hash, role='internal', is_active=true, is_email_verified=true, invite_accepted_at=NOW())
- Return: { success: true, data: { id, name, email, role } }
```

Also add `GET /api/users/internal` (admin-only) — list only users with role='internal', ordered by created_at DESC.

#### 3b. Frontend — new page `src/app/(dashboard)/users/internal/page.tsx`

Page title: **"Internal Users (Employees)"**

- Table columns: Name, Email, Status (Active/Inactive badge), Created At, Actions (Activate/Deactivate toggle)
- Top-right button: **"Add Employee"** → opens Dialog
- Dialog fields:
  - Full Name (required)
  - Email Address (required, type=email)
  - Password (required, min 8 chars, show/hide toggle)
  - Confirm Password (required, must match)
- On submit: calls `POST /api/users/create-internal`
- On success: toast "Employee created successfully", close dialog, refresh table
- On error: show error message inside dialog (e.g. "Email already exists")

#### 3c. Update sidebar navigation

In `src/components/layout/Sidebar.tsx`, under the "Users" section, add two sub-items:
- **All Users** → `/users`
- **Employees** → `/users/internal`

Or replace the single "Users" link with two separate sidebar items clearly labeled.

---

### PHASE 4 — Fix Cloudinary Image Upload

#### 4a. Diagnose

In `backend/routes/upload.js`, the upload uses `multer.memoryStorage()` and pipes buffer to `cloudinary.uploader.upload_stream`. Test this directly:

```bash
curl -X POST http://localhost:5000/api/upload/image \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/test.jpg"
```

Check `docker compose logs backend` for the actual Cloudinary error message.

#### 4b. Fix upload route

Replace the stream-pipe approach with `cloudinary.uploader.upload()` using a base64 data URI (more reliable in Node with memoryStorage):

```js
// backend/routes/upload.js
router.post('/image', authenticate, requireRole('admin', 'internal'), upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });
  try {
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'prosubx/products',
      resource_type: 'image',
    });
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, error: 'Image upload failed', detail: err.message });
  }
});
```

#### 4c. Ensure Cloudinary env vars are in docker-compose

In `docker-compose.yml` backend environment, confirm these are set (they should already be):
```yaml
CLOUDINARY_CLOUD_NAME: dlgk8ngmu
CLOUDINARY_API_KEY: 451714164697449
CLOUDINARY_API_SECRET: lphUf_yyi2uNyPxNaBeLzzVRlRw
```

After fixing, restart backend: `docker compose restart backend`

#### 4d. Product form — add missing fields

In `src/app/(dashboard)/products/new/page.tsx` AND `src/app/(dashboard)/products/[id]/page.tsx`, add these fields to the form:

- **Category** (text input, optional) — maps to `category` column in products table. If column doesn't exist, add it: `ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);`
- **HSN/SAC Code** (text input, optional) — `ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);`
- **Tax** (select dropdown) — fetch from `GET /api/taxes`, show name + rate%, maps to `tax_id` FK on products. If FK doesn't exist: `ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_id UUID REFERENCES taxes(id);`
- **Discount** (select dropdown, optional) — fetch from `GET /api/discounts`, maps to `default_discount_id`. If doesn't exist: `ALTER TABLE products ADD COLUMN IF NOT EXISTS default_discount_id UUID REFERENCES discounts(id);`
- **Is Active** (switch toggle, default true)
- **Description** — change from `<Input>` to `<Textarea>` (rows=3)

Run the ALTER TABLE migrations directly against the local postgres container:
```bash
docker compose exec postgres psql -U postgres -d subscription_db -c "
  ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_id UUID REFERENCES taxes(id);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS default_discount_id UUID REFERENCES discounts(id);
"
```

Update `backend/controllers/productsController.js` create and update handlers to accept and store these new fields.

---

### PHASE 5 — Invoice PDF Download (Always "Paid" Status)

Business rule: **Invoices are only created AFTER a successful payment. Therefore every invoice is always `paid`.**

#### 5a. Backend — ensure invoice is always created as paid after payment

In `backend/controllers/paymentsController.js` (or wherever payment confirmation happens), after a successful payment:
1. Create invoice with `status = 'paid'`
2. Set `payment_id` on the invoice record
3. Set `paid_at = NOW()`

Add column if missing:
```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
```

In the invoice list API response, always include: `payment_id`, `paid_at`, and the linked `payment.razorpay_payment_id` (or manual payment ref).

#### 5b. Frontend — Invoice detail page with PDF download

Update `src/app/(dashboard)/invoices/[id]/page.tsx` to:

1. Show full invoice detail:
   - Invoice number, issued date, paid date
   - Customer name, email, address, GSTIN
   - Line items table: Product name, quantity, unit price, tax %, discount, line total
   - Subtotal, tax amount, discount amount, grand total
   - Payment ID / Razorpay reference
   - Status badge (always "Paid" — green)

2. Add **"Download PDF"** button using `jspdf` + `html2canvas`:
   - Install: `npm install jspdf html2canvas` (inside frontend container or rebuild)
   - In `frontend/package.json` add `"jspdf": "^2.5.1"` and `"html2canvas": "^1.4.1"` to dependencies
   - Wrap the invoice detail card in a `ref` div with `id="invoice-pdf-content"`
   - On button click, use `html2canvas` to capture the div, then `jspdf` to create A4 PDF
   - PDF filename: `Invoice-{invoice_number}.pdf`

3. Invoice PDF format should include:
   - Company name "ProsubX" with logo placeholder top-left
   - Invoice number, date, due date (top-right)
   - Bill To: customer details
   - Line items table with columns: Item, Qty, Rate, Tax, Amount
   - Totals section: Subtotal / Tax / Discount / **Grand Total** (bold)
   - Footer: "Thank you for your business" + payment reference
   - Green "PAID" watermark stamp diagonally

#### 5c. Portal users can also download their own invoices

Ensure `src/app/(portal)/my-invoices/[id]/page.tsx` has the same PDF download button.

---

### PHASE 6 — Dashboard Enhancements

Replace the plain revenue list with a proper bar chart using `recharts`:

1. Install recharts: add `"recharts": "^2.10.3"` to `frontend/package.json`
2. In `src/app/(dashboard)/dashboard/page.tsx`:
   - Replace the monthly revenue list with a `<BarChart>` (recharts) showing last 12 months
   - X-axis: month labels, Y-axis: revenue in ₹
   - Bar color: `#6366f1` (indigo-500)
   - Tooltip showing exact amount
   - Add a **Subscription Status Pie Chart** (recharts `<PieChart>`) — slices for active/paused/cancelled/expired counts — fetch from `GET /api/reports/subscription-status-breakdown` (create this endpoint if missing)
3. Add a **"Recent Activity"** feed card — last 10 events (new subscription, payment received, invoice generated) — fetch from `GET /api/reports/recent-activity` (create if missing, query last 10 rows across subscriptions + payments joined with customer name)
4. Add a **"Quick Actions"** card with buttons: New Subscription, New Product, Add Employee, View Reports

---

### PHASE 7 — Subscriptions Section

#### 7a. List page improvements
- Add status filter tabs: All | Active | Paused | Cancelled | Expired
- Add search input (filter by customer name or subscription number)
- Show "Renewal Date" column (next billing date)

#### 7b. Create subscription form — `src/app/(dashboard)/subscriptions/new/page.tsx`
Ensure these fields are all working:
- Customer (searchable select — fetch `GET /api/customers`, show company_name or email)
- Product (searchable select — fetch `GET /api/products?is_active=true`)
- Recurring Plan (select — fetch `GET /api/plans`)
- Quantity (number, default 1)
- Start Date (date picker)
- Notes (textarea, optional)
- On submit: `POST /api/subscriptions` → redirect to `/subscriptions/{id}`

#### 7c. Subscription detail page — `src/app/(dashboard)/subscriptions/[id]/page.tsx`
Show:
- Subscription number, status badge, customer info
- Plan name, product name, quantity, price
- Start date, end date / renewal date
- Timeline of status changes
- Linked invoices list (with Download PDF links)
- Linked payments list
- Action buttons: Pause | Resume | Cancel | Renew (only show relevant ones based on current status)
  - Pause → `PATCH /api/subscriptions/{id}/pause`
  - Resume → `PATCH /api/subscriptions/{id}/resume`
  - Cancel → `PATCH /api/subscriptions/{id}/cancel` (confirm dialog)

---

### PHASE 8 — Configuration Sections

#### 8a. Discounts — `src/app/(dashboard)/configuration/discounts/page.tsx`
- Table: Name, Type (percentage/fixed), Value, Min Order Amount, Valid From, Valid To, Status
- Create dialog: name, type (select), value, min_order_amount, valid_from, valid_to
- Toggle active/inactive per row

#### 8b. Taxes — `src/app/(dashboard)/configuration/taxes/page.tsx`
- Table: Name, Rate (%), Type (GST/IGST/VAT/Other), Status
- Create dialog: name, rate, type
- Toggle per row

#### 8c. Quotation Templates — `src/app/(dashboard)/configuration/quotation-templates/page.tsx`
- Table: Name, Type, Created At, Status
- Create/Edit: name, subject, body (textarea with preview)
- Toggle per row

#### 8d. Recurring Plans — already built, but add Edit capability
- Add "Edit" button per row → opens pre-filled dialog
- `PUT /api/plans/{id}` endpoint (create if missing)

---

### PHASE 9 — Payments Section Enhancements

In `src/app/(dashboard)/payments/page.tsx`:
- Show full Payment ID (not truncated) in a copyable `<code>` tag
- Link invoice number to `/invoices/{invoice_id}`
- Add "Record Manual Payment" button → Dialog:
  - Select Invoice (searchable, only unpaid invoices)
  - Amount (pre-filled from invoice total)
  - Payment Method (select: bank_transfer, cheque, cash, upi, other)
  - Reference Number (text)
  - Payment Date (date)
  - Notes (textarea)
  - On submit: `POST /api/payments/manual`

---

### PHASE 10 — Reports Section Enhancements

In `src/app/(dashboard)/reports/page.tsx`, use recharts for all charts:

1. **Revenue Bar Chart** — 12 months, indigo bars
2. **Subscription Status Pie Chart** — active/paused/cancelled/expired
3. **Invoice Summary Table** — status breakdown with totals
4. **Top Products** card — by revenue, show product name + total revenue
5. **Export CSV** button for each report section — generates and downloads a CSV file client-side from the data already fetched

---

### PHASE 11 — UX & Visual Polish (Apply to All Admin Pages)

1. **Framer Motion animations** — page-level fade-in (`initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`) on every page's root div
2. **Table row hover** — `hover:bg-slate-50` on all DataTable rows
3. **Skeleton loading** — every table shows skeleton rows (8 rows × correct columns) while loading
4. **Toast notifications** — every create/update/delete shows `toast.success(...)` or `toast.error(...)`
5. **Empty states** — every empty table shows icon + message + CTA button
6. **Sidebar active state** — current route highlighted with `bg-indigo-50 text-indigo-700 font-semibold`
7. **Breadcrumbs** — add breadcrumb trail on all detail pages (e.g. Subscriptions > SUB-0001)
8. **Responsive** — all tables must be horizontally scrollable on mobile (`overflow-x-auto`)
9. **Confirm dialogs** — all destructive actions (delete, cancel, deactivate) use `ConfirmDialog` component

---

### PHASE 12 — Backend Routes Audit

Check these routes exist and work. Create any that are missing:

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/users | List all users (admin) |
| GET | /api/users/internal | List internal users only (admin) |
| POST | /api/users/create-internal | Create employee directly (admin) |
| PATCH | /api/users/:id/toggle | Toggle active status (admin) |
| GET | /api/products | List products (paginated, filter by is_active) |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Soft delete (set is_active=false) |
| GET | /api/subscriptions | List (paginated, filter by status) |
| POST | /api/subscriptions | Create |
| GET | /api/subscriptions/:id | Detail with customer, plan, invoices, payments |
| PATCH | /api/subscriptions/:id/pause | Pause |
| PATCH | /api/subscriptions/:id/resume | Resume |
| PATCH | /api/subscriptions/:id/cancel | Cancel |
| GET | /api/invoices | List (paginated) |
| GET | /api/invoices/:id | Detail with line items, payment info |
| GET | /api/payments | List (paginated) |
| POST | /api/payments/manual | Record manual payment |
| GET | /api/reports/dashboard | KPI metrics |
| GET | /api/reports/monthly-revenue | Last 12 months |
| GET | /api/reports/overdue-invoices | Overdue list |
| GET | /api/reports/subscription-status-breakdown | Counts by status |
| GET | /api/reports/recent-activity | Last 10 events |
| GET | /api/plans | List recurring plans |
| POST | /api/plans | Create plan |
| PUT | /api/plans/:id | Update plan |
| PATCH | /api/plans/:id/toggle | Toggle active |
| GET | /api/taxes | List taxes |
| POST | /api/taxes | Create tax |
| PATCH | /api/taxes/:id/toggle | Toggle |
| GET | /api/discounts | List discounts |
| POST | /api/discounts | Create discount |
| PATCH | /api/discounts/:id/toggle | Toggle |
| POST | /api/upload/image | Upload image to Cloudinary |

---

### PHASE 13 — DB Migrations (run via docker exec)

Apply all required schema changes:

```sql
-- Product enhancements
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_id UUID REFERENCES taxes(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_discount_id UUID REFERENCES discounts(id);

-- Invoice payment linkage
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Internal user direct creation (no invite needed)
-- No schema change needed — just use existing columns with invite_accepted_at = NOW()
```

Run via:
```bash
docker compose exec postgres psql -U postgres -d subscription_db -c "<SQL above>"
```

---

### PHASE 14 — Package Dependencies

Add to `frontend/package.json` dependencies (then rebuild frontend container):

```json
"recharts": "^2.10.3",
"jspdf": "^2.5.1",
"html2canvas": "^1.4.1"
```

Add to `frontend/package.json` devDependencies:
```json
"@types/html-canvas": "^1.0.0"
```

After updating package.json, rebuild:
```bash
docker compose build --no-cache frontend && docker compose up -d frontend
```

---

## Definition of Done

- [ ] Admin can log in and see a dashboard with real charts (bar + pie via recharts)
- [ ] Dashboard shows: active subscriptions, monthly revenue, overdue invoices, pending payments, expiring soon, total users, total customers — all as live KPI cards
- [ ] Subscriptions: list with status filter tabs, create works, detail page shows all info + pause/resume/cancel actions
- [ ] Products: list works, create works WITH image upload to Cloudinary, form includes category/HSN/tax/discount fields
- [ ] Cloudinary upload returns a real URL and image shows in product table
- [ ] Invoices: list works, detail page shows full breakdown, PDF download generates a formatted A4 PDF with "PAID" stamp
- [ ] Payments: list works, manual payment dialog works
- [ ] Reports: all 4 charts render with real data
- [ ] Users → All Users page shows all users, toggle works
- [ ] Users → Employees page: admin can create employee with name+email+password directly, employee appears immediately as active with role='internal'
- [ ] Configuration: Recurring Plans create+toggle works; Discounts create+toggle works; Taxes create+toggle works; Quotation Templates create works
- [ ] All pages have loading skeletons, empty states, error toasts
- [ ] No TypeScript errors in any dashboard page
- [ ] Sidebar shows correct active state, all navigation links work

---

## Important Constraints

- Do NOT change portal role pages — only admin/internal dashboard pages
- Do NOT break the existing auth flow (login, signup, forgot-password)
- All backend changes must be backwards compatible — do not drop columns
- When creating the employee (internal user), use `role = 'internal'` exactly as in the DB enum
- Invoice status must always be set to `'paid'` when created post-payment — never `'pending'` or `'draft'`
- Primary color is always indigo-500 (`#6366f1`) — do not introduce other brand colors
- All amounts are in Indian Rupees (₹) — format with `.toLocaleString('en-IN')`
- Backend is Express.js CommonJS (not ESM) — use `require()` not `import`
- Frontend is Next.js 14 App Router with `'use client'` on interactive pages
