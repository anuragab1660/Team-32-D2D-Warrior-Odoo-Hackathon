  # Subscription Management System — Frontend Reference

> **Stack:** Next.js · shadcn/ui · Tailwind CSS · Razorpay.js  
> **Version:** 1.0 · April 2025  
> **Backend:** Express.js REST API · 60+ Endpoints · JWT Auth  
> **Roles:** Admin · Internal · Customer (Portal)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Folder Structure](#3-folder-structure)
4. [Authentication & Route Guards](#4-authentication--route-guards)
5. [Role-Based UI Strategy](#5-role-based-ui-strategy)
6. [Pages & Features Reference](#6-pages--features-reference)
   - 6.1 [Auth Pages](#61-auth-pages)
   - 6.2 [Admin Dashboard](#62-admin-dashboard)
   - 6.3 [Products Module](#63-products-module)
   - 6.4 [Taxes Module](#64-taxes-module)
   - 6.5 [Discounts Module](#65-discounts-module)
   - 6.6 [Recurring Plans Module](#66-recurring-plans-module)
   - 6.7 [Quotation Templates Module](#67-quotation-templates-module)
   - 6.8 [Subscriptions Module](#68-subscriptions-module)
   - 6.9 [Invoices Module](#69-invoices-module)
   - 6.10 [Payments Module](#610-payments-module)
   - 6.11 [Reports Module](#611-reports-module)
   - 6.12 [Customer Portal](#612-customer-portal)
7. [API Integration Layer](#7-api-integration-layer)
8. [Razorpay Integration](#8-razorpay-integration)
9. [State Management](#9-state-management)
10. [Error Handling & Toast Notifications](#10-error-handling--toast-notifications)
11. [Environment & Setup](#11-environment--setup)
12. [Component Library Reference](#12-component-library-reference)

---

## 1. Project Overview

The frontend is a **Next.js** application serving three distinct user roles on separate route namespaces. The app connects to the Express.js backend via REST API with JWT authentication.

### User Flow Summary

```
Public Routes (/login, /signup, /verify-email, /set-password, /forgot-password)
      ↓ Login
Role-Based Dashboard
      ├── Admin   → /admin/*    Full system control
      ├── Internal → /app/*     Day-to-day operations
      └── Portal   → /portal/*  Own subscriptions & invoices only
```

### Business Flow (Mirrored from Backend)

```
Products Catalog
      ↓
Attach Recurring Plans + Variants
      ↓
Create Subscription (optionally from Quotation Template)
      ↓
Apply Discounts & Taxes
      ↓
Auto-generate Invoice
      ↓
Customer Pays via Razorpay (or manual)
      ↓
Reports & Analytics Dashboard
```

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| UI Component Library | shadcn/ui |
| Styling | Tailwind CSS |
| HTTP Client | Axios or native `fetch` with interceptors |
| Auth State | `localStorage` / `httpOnly` cookie for tokens |
| Payment UI | Razorpay Checkout SDK (loaded via script tag) |
| Form Handling | React Hook Form + Zod validation |
| Tables | TanStack Table (via shadcn DataTable) |
| Charts (Reports) | Recharts or shadcn Charts |
| Notifications | shadcn `toast` (Sonner) |

### Directory Architecture

```
Next.js App Router
├── (public)          → Unauthenticated pages
├── (admin)           → Admin-only routes
├── (app)             → Admin + Internal shared routes
└── (portal)          → Customer-only routes
```

---

## 3. Folder Structure

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx        # GET /api/auth/verify-email?token=
│   │   ├── set-password/page.tsx        # Accept invite — POST /api/auth/accept-invite
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   │
│   ├── (admin)/
│   │   ├── layout.tsx                   # Requires role='admin'
│   │   ├── admin/
│   │   │   ├── users/page.tsx           # Manage internal users
│   │   │   ├── invitations/page.tsx     # Pending invitations
│   │   │   └── taxes/page.tsx           # Tax rule management
│   │
│   ├── (app)/
│   │   ├── layout.tsx                   # Requires role='admin' | 'internal'
│   │   ├── dashboard/page.tsx           # KPI overview
│   │   ├── products/
│   │   │   ├── page.tsx                 # Product list
│   │   │   ├── [id]/page.tsx            # Product detail + variants
│   │   │   └── new/page.tsx
│   │   ├── plans/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── templates/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── discounts/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── subscriptions/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx            # Full detail — lines, taxes, discounts
│   │   │   └── new/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── payments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── reports/
│   │       ├── page.tsx                 # Main analytics
│   │       └── overdue/page.tsx
│   │
│   └── (portal)/
│       ├── layout.tsx                   # Requires role='portal'
│       ├── portal/
│       │   ├── dashboard/page.tsx
│       │   ├── subscriptions/page.tsx   # GET /api/subscriptions/my
│       │   ├── subscriptions/[id]/page.tsx
│       │   ├── invoices/page.tsx        # GET /api/invoices/my
│       │   ├── invoices/[id]/page.tsx
│       │   └── profile/page.tsx
│
├── components/
│   ├── ui/                              # shadcn/ui auto-generated
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PortalLayout.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── products/
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   └── VariantManager.tsx
│   ├── subscriptions/
│   │   ├── SubscriptionForm.tsx
│   │   ├── SubscriptionLines.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StatusTransitionButton.tsx
│   ├── invoices/
│   │   ├── InvoiceTable.tsx
│   │   ├── InvoiceDetail.tsx
│   │   └── PaymentStatusBadge.tsx
│   ├── payments/
│   │   ├── RazorpayButton.tsx           # Loads Razorpay checkout
│   │   └── ManualPaymentForm.tsx
│   └── reports/
│       ├── KPICards.tsx
│       ├── RevenueChart.tsx
│       └── OverdueTable.tsx
│
├── lib/
│   ├── api.ts                           # Axios instance + interceptors
│   ├── auth.ts                          # Token helpers (get/set/clear)
│   └── razorpay.ts                      # Razorpay order + verify helpers
│
├── hooks/
│   ├── useAuth.ts                       # Current user context
│   ├── useRole.ts                       # Role-based guards
│   └── useToast.ts
│
├── types/
│   ├── auth.ts
│   ├── product.ts
│   ├── subscription.ts
│   ├── invoice.ts
│   ├── payment.ts
│   └── reports.ts
│
└── middleware.ts                         # Next.js middleware — JWT check + role redirect
```

---

## 4. Authentication & Route Guards

### Token Storage Strategy

```typescript
// Access token: memory (or sessionStorage for tab persistence)
// Refresh token: httpOnly cookie (preferred) or localStorage

// On login success — backend returns:
{
  "access_token": "eyJ...",       // 15-minute TTL
  "refresh_token": "eyJ..."       // 7-day TTL
}
```

### Axios Interceptor — Auto Refresh

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// Attach access token on every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken(); // POST /api/auth/refresh-token
      setAccessToken(newToken);
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Next.js Middleware — Route Protection

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from './lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  if (!token) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/app') || pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const payload = decodeJwt(token);
  const role = payload?.role;

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
  }

  if (pathname.startsWith('/portal') && role !== 'portal') {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*', '/portal/:path*'],
};
```

---

## 5. Role-Based UI Strategy

Map permission matrix from the backend directly to UI element visibility:

| UI Element | Admin | Internal | Portal |
|---|---|---|---|
| "Create Internal User" button | ✅ | ❌ | ❌ |
| Taxes tab in sidebar | ✅ | ❌ | ❌ |
| Discounts tab in sidebar | ✅ | ❌ | ❌ |
| "Toggle Active" buttons | ✅ | ❌ | ❌ |
| "Delete" actions | ✅ | ❌ | ❌ |
| Manual payment form | ✅ | ✅ | ❌ |
| Reports sidebar item | ✅ | ✅ | ❌ |
| Pending Invitations page | ✅ | ❌ | ❌ |
| Razorpay "Pay Now" button | ✅ | ✅ | ✅ |
| Customer portal views | ❌ | ❌ | ✅ |

### Role Hook

```typescript
// hooks/useRole.ts
import { useAuth } from './useAuth';

export function useRole() {
  const { user } = useAuth();
  return {
    isAdmin: user?.role === 'admin',
    isInternal: user?.role === 'internal',
    isPortal: user?.role === 'portal',
    canManageTaxes: user?.role === 'admin',
    canManageDiscounts: user?.role === 'admin',
    canRecordManualPayment: user?.role === 'admin' || user?.role === 'internal',
  };
}
```

---

## 6. Pages & Features Reference

### 6.1 Auth Pages

#### `/login`
- Fields: `email`, `password`
- API: `POST /api/auth/login`
- On success: decode JWT → redirect by role
  - `admin` / `internal` → `/app/dashboard`
  - `portal` → `/portal/dashboard`
- Error handling: inactive account, unverified email, wrong credentials

#### `/signup` (Customer self-registration)
- Fields: `name`, `email`, `password`
- API: `POST /api/auth/signup`
- On success: show "Check your email to verify your account" banner
- Password rules (enforce client-side): uppercase + lowercase + number + special character + min 8 chars

#### `/verify-email`
- Reads `?token=` from URL query param
- API: `GET /api/auth/verify-email?token=<TOKEN>`
- On success: redirect to `/login` with "Email verified!" toast
- On failure: show "Invalid or expired link" with resend option

#### `/set-password` (Internal user invite acceptance)
- Reads `?token=` from URL
- Fields: `password`, `confirm_password`
- API: `POST /api/auth/accept-invite { token, password }`
- On success: user is logged in — redirect to `/app/dashboard`

#### `/forgot-password`
- Fields: `email`
- API: `POST /api/auth/forgot-password`
- Always show success message (backend always returns 200 — prevents email enumeration)

#### `/reset-password`
- Reads `?token=` from URL
- Fields: `password`, `confirm_password`
- API: `POST /api/auth/reset-password { token, password }`

---

### 6.2 Admin Dashboard

**Route:** `/app/dashboard`  
**Auth:** Admin + Internal

Fetches: `GET /api/reports/dashboard`

**KPI Cards to display:**

| Card | Metric |
|---|---|
| Active Subscriptions | Count of `status='active'` subscriptions |
| Monthly Revenue | From `v_monthly_revenue` — current month total |
| Overdue Invoices | Count + total amount outstanding |
| Pending Payments | Payments with `status='pending'` |

**Additional sections:**
- Recent Subscriptions (last 5)
- Overdue Invoices quick-view table (link to full overdue report)
- Monthly Revenue sparkline chart

---

### 6.3 Products Module

**Routes:** `/app/products`, `/app/products/new`, `/app/products/[id]`  
**Auth:** Admin + Internal (toggle/delete: Admin only)

#### Product List Page
- Filterable table: `is_active` toggle filter, `type` dropdown (`service`, `physical`, `digital`, `other`)
- Columns: Name · Type · Sales Price · Cost Price · Active Status · Actions
- API: `GET /api/products?is_active=true&type=service`
- Admin-only: Activate/Deactivate toggle (`PATCH /api/products/:id/toggle`)
- Admin-only: Delete button — soft delete, shows confirmation dialog

#### Product Form (Create/Edit)
- Fields: `name`, `product_type`, `description`, `sales_price`, `cost_price`, `is_active`
- API: `POST /api/products` / `PUT /api/products/:id`

#### Product Detail + Variant Manager
- Shows product info + variant list
- Variant columns: Attribute · Value · Extra Price · Active
- Add/Edit variant form (inline or modal):
  - Fields: `attribute`, `value`, `extra_price`
- Pricing note display: *"Final line price = Sales Price + Variant Extra Price"*

---

### 6.4 Taxes Module

**Routes:** `/app/taxes`, `/app/taxes/new`, `/app/taxes/[id]`  
**Auth:** Admin only (view: Admin + Internal)

#### Tax List
- Columns: Name · Type (percentage/fixed) · Rate · Active · Actions
- Pre-seeded data: GST 5%, GST 12%, GST 18%, GST 28%
- Toggle active/inactive
- Delete — blocked by backend if tax is currently in use (show user-friendly error)

#### Tax Form
- Fields: `name`, `type` (percentage/fixed), `rate`, `description`
- Rate display: For `percentage` type, show `%` suffix. For `fixed`, show `₹` prefix.

---

### 6.5 Discounts Module

**Routes:** `/app/discounts`, `/app/discounts/new`, `/app/discounts/[id]`  
**Auth:** Admin only for create/edit/delete. Admin + Internal for viewing.

#### Discount List
- Columns: Name · Type · Value · Usage (used/limit) · Valid Dates · Active
- Applies-to badges: "Products" / "Subscriptions"

#### Discount Form
- Fields: `name`, `type` (fixed/percentage), `value`, `min_purchase`, `min_quantity`, `start_date`, `end_date`, `usage_limit`, `applies_to_products`, `applies_to_subscriptions`
- Validation: `value` must be > 0. `end_date` must be after `start_date`.

#### Discount Detail
- Shows `usage_count` (current uses vs limit)
- Delete blocked if `usage_count > 0`

---

### 6.6 Recurring Plans Module

**Routes:** `/app/plans`, `/app/plans/new`, `/app/plans/[id]`  
**Auth:** Admin + Internal (toggle/delete: Admin only)

#### Plan List
- Filter by `billing_period` and `is_active`
- Columns: Name · Period · Price · Auto-close · Pausable · Renewable · Active

#### Plan Form
- Fields: `name`, `price`, `billing_period`, `min_quantity`, `start_date`, `end_date`
- Boolean toggles (shadcn Switch): `auto_close`, `closable`, `pausable`, `renewable`

#### Plan Detail
- Shows linked subscription count (from backend)
- Delete blocked if subscriptions are linked

---

### 6.7 Quotation Templates Module

**Routes:** `/app/templates`, `/app/templates/new`, `/app/templates/[id]`  
**Auth:** Admin + Internal (toggle/delete: Admin only)

#### Template List
- Columns: Name · Linked Plan · Validity Days · Line Count · Active

#### Template Form + Line Manager
- Template fields: `name`, `validity_days`, `recurring_plan_id` (dropdown of active plans)
- Product Lines section (add inline):
  - Select product → optional variant → set `quantity` and `unit_price`
  - `unit_price` auto-fills from product's `sales_price` + selected variant's `extra_price`

---

### 6.8 Subscriptions Module

**Routes:** `/app/subscriptions`, `/app/subscriptions/new`, `/app/subscriptions/[id]`  
**Auth:** Admin + Internal

#### Subscription List
- Filters: `status`, `customer`, `plan`
- Columns: SUB Number · Customer · Plan · Status · Start Date · Expiration · Created By
- Status badge colors:

| Status | Color |
|---|---|
| `draft` | Gray |
| `quotation` | Blue |
| `confirmed` | Amber |
| `active` | Green |
| `closed` | Red |

#### Subscription Create / Edit

> Only editable when status is `draft` or `quotation`.

**Header fields:** `customer_id`, `plan_id`, `template_id` (optional — auto-fills lines), `start_date`, `expiration_date`, `payment_terms`, `notes`

**From Template flow:**
1. User selects a template → `GET /api/templates/:id`
2. Lines auto-populate with template's product lines
3. User can adjust quantities, prices, or add more lines

**Product Lines table:**
- Per line: Product · Variant · Quantity · Unit Price · Discount · Taxes (multi-select) · Tax Amount · Discount Amount · Total
- Line total formula: `(unit_price × qty) + tax_amount − discount_amount`

#### Status Transitions

```
draft → quotation   (Send to Customer)
quotation → confirmed   (Customer Approved)
confirmed → active   (Activate)
active → closed   (Close Subscription)
```

Implement as a `StatusTransitionButton` that shows the **next valid action** based on current status. Show a confirmation dialog before transitioning.

#### Generate Invoice Button

Visible when `status = 'confirmed'` or `status = 'active'`:
- API: `POST /api/subscriptions/:id/invoice`
- On success: redirect to the newly created invoice detail page

---

### 6.9 Invoices Module

**Routes:** `/app/invoices`, `/app/invoices/[id]`  
**Auth:** Admin + Internal (cancel: Admin only)

#### Invoice List
- Filters: `status`, `customer`, date range
- Columns: INV Number · Customer · Subtotal · Tax · Discount · Grand Total · Status · Due Date · Issued Date

#### Invoice Detail
- Full breakdown: header info, line items table, totals summary
- Payment summary section: Total Paid vs Outstanding (from `GET /api/invoices/:id/payment-status`)
- Action buttons:
  - **Confirm** (`PATCH /api/invoices/:id/confirm`) — when `status = 'draft'`
  - **Cancel** (`PATCH /api/invoices/:id/cancel`) — Admin only, when `draft` or `confirmed`
  - **Pay Now (Razorpay)** — when `status = 'confirmed'` and outstanding > 0
  - **Record Manual Payment** — Admin/Internal only

#### Invoice Status Badges

| Status | Color |
|---|---|
| `draft` | Gray |
| `confirmed` | Amber |
| `paid` | Green |
| `cancelled` | Red |

---

### 6.10 Payments Module

**Routes:** `/app/payments`, `/app/payments/[id]`  
**Auth:** Admin + Internal

#### Payment List
- Filters: `status`, `method`, date range
- Columns: Invoice # · Customer · Amount · Method · Date · Status · Razorpay ID

#### Manual Payment Form

Available when the logged-in user is Admin or Internal:

```
Fields:
- invoice_id (auto-filled if coming from invoice detail)
- amount
- payment_method: 'bank_transfer' | 'cash' | 'other'
- payment_date
- reference_number (cheque # or transfer ref)
- notes
```

API: `POST /api/payments/manual`

---

### 6.11 Reports Module

**Routes:** `/app/reports`  
**Auth:** Admin + Internal

#### Dashboard KPIs

Fetches: `GET /api/reports/dashboard`

Display as stat cards with trend indicators.

#### Monthly Revenue Chart

- API: `GET /api/reports/monthly-revenue`
- Render as a bar or area chart (Recharts)
- X-axis: Month · Y-axis: Revenue (₹)

#### Active Subscriptions Report

- API: `GET /api/reports/active-subscriptions`
- Table: Customer Name · Company · Plan · Billing Period · Plan Price · Start Date

#### Invoice Summary Report

- API: `GET /api/reports/invoice-summary`
- Table: Invoice # · Customer · Grand Total · Amount Paid · Amount Outstanding · Status · Due Date

#### Overdue Invoices Report

- API: `GET /api/reports/overdue-invoices`
- Table: Invoice # · Customer · Grand Total · Outstanding · Due Date · **Days Overdue** (highlight red if > 30)

#### Pending Invitations (Admin only)

- API: `GET /api/auth/invitations`
- Table: Internal User · Invited By · Email · Expires At · Is Expired
- Resend invite action: `POST /api/auth/resend-invite`

---

### 6.12 Customer Portal

**Routes:** `/portal/dashboard`, `/portal/subscriptions`, `/portal/invoices`, `/portal/profile`  
**Auth:** `portal` role only

#### Portal Dashboard
- Active subscription count
- Unpaid invoices count and total outstanding
- Quick links to subscriptions and invoices

#### Portal Subscriptions
- API: `GET /api/subscriptions/my`
- Read-only view — no create/edit actions
- Shows: Subscription # · Plan · Status · Start Date · Expiration

#### Portal Invoices
- API: `GET /api/invoices/my`
- For each confirmed invoice with outstanding balance — show **Pay Now** button

#### Pay Now (Razorpay) — Portal User
- See Section 8 for full Razorpay integration flow

---

## 7. API Integration Layer

### Base Setup

```typescript
// lib/api.ts
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // e.g. http://localhost:5000
  headers: { 'Content-Type': 'application/json' },
});
```

### Standard Response Shape

All API responses follow this envelope:

```typescript
// Success
interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error
interface ApiError {
  success: false;
  error: string;
  details?: { field: string; message: string }[];
}
```

### HTTP Status Code Handling

| Code | Frontend Action |
|---|---|
| `200 / 201` | Show success toast + refresh data |
| `400` | Show field-level validation errors from `details[]` |
| `401` | Auto-refresh token → retry. If refresh fails → redirect to login |
| `403` | Show "You don't have permission" toast, don't show action button |
| `404` | Show "Not found" page |
| `409` | Show specific conflict message (e.g. "Email already in use") |
| `422` | Show business logic error (e.g. "Plan cannot be deleted — subscriptions linked") |
| `500` | Show generic error toast + log to console |

---

## 8. Razorpay Integration

> ⚠️ **Never trust client-side payment success alone. Always call `/api/payments/verify` server-side before marking any invoice as paid.**

### Frontend Razorpay Flow

```typescript
// components/payments/RazorpayButton.tsx

async function handlePayNow(invoiceId: string) {
  // Step 1: Create Razorpay order
  const { data } = await api.post('/api/payments/create-order', { invoice_id: invoiceId });
  const { order_id, amount, currency } = data.data;

  // Step 2: Open Razorpay checkout popup
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount,
    currency,
    order_id,
    name: 'Your Company Name',
    description: `Invoice Payment`,
    prefill: {
      name: user.name,
      email: user.email,
    },
    handler: async function (response: RazorpayResponse) {
      // Step 3: Verify signature server-side
      await api.post('/api/payments/verify', {
        order_id: response.razorpay_order_id,
        payment_id: response.razorpay_payment_id,
        signature: response.razorpay_signature,
        invoice_id: invoiceId,
      });

      // Step 4: Refresh invoice + show success
      toast.success('Payment successful!');
      router.refresh();
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
```

### Load Razorpay Script

Add to `app/layout.tsx`:

```tsx
<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
```

### Razorpay Env Variable

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
# Never expose RAZORPAY_KEY_SECRET in the frontend
```

---

## 9. State Management

The app uses **React Server Components + Client Components** without a global store:

- **Server Components:** Fetch data directly via `fetch()` or API calls in page files
- **Client Components:** Use React state (`useState`) for form interactivity
- **Auth context:** Provided via a lightweight React context wrapping the layout

```typescript
// context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (tokens: Tokens) => void;
  logout: () => void;
}
```

For complex data-fetching patterns, use `SWR` or `React Query` (TanStack Query):

```typescript
// Example — subscription detail with auto-refresh
const { data, mutate } = useSWR(`/api/subscriptions/${id}`, fetcher);
```

---

## 10. Error Handling & Toast Notifications

### Global API Error Handler

```typescript
// lib/api.ts — response interceptor (error side)
function handleApiError(error: AxiosError<ApiError>) {
  const status = error.response?.status;
  const errorData = error.response?.data;

  if (status === 400 && errorData?.details) {
    // Field-level validation — return to form
    return { fieldErrors: errorData.details };
  }

  const message = errorData?.error || 'Something went wrong';
  toast.error(message);
}
```

### Toast Patterns

```typescript
// Success
toast.success('Subscription created successfully');

// Business logic error (422)
toast.error('Cannot delete plan — 3 subscriptions are linked to it');

// Field error (display inline in form, not toast)
form.setError('email', { message: 'Email is already in use' });

// Permission error (403)
toast.error("You don't have permission to perform this action");
```

---

## 11. Environment & Setup

### `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
NEXT_PUBLIC_APP_NAME=Subscription Management System
```

### Install & Run

```bash
# Install dependencies
npm install

# Initialize shadcn/ui (if not already done)
npx shadcn-ui@latest init

# Add required shadcn components
npx shadcn-ui@latest add button input label table badge dialog toast switch select form

# Run development server
npm run dev
```

### Next.js Config

```typescript
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};
```

---

## 12. Component Library Reference

### Key shadcn/ui Components Used

| Component | Used For |
|---|---|
| `DataTable` (TanStack) | All list/grid pages |
| `Dialog` / `AlertDialog` | Confirmation modals, delete confirmations |
| `Form` + `Input` | All create/edit forms |
| `Select` | Dropdowns (product type, billing period, discount type) |
| `Switch` | Boolean toggles (auto_close, pausable, is_active) |
| `Badge` | Status labels (subscription status, invoice status) |
| `Toast` (Sonner) | All success/error notifications |
| `Tabs` | Product detail (info tab + variants tab) |
| `Card` | KPI dashboard tiles |
| `Separator` | Section dividers |
| `DatePicker` | start_date, end_date, due_date fields |

### Status Badge Component

```tsx
// components/subscriptions/StatusBadge.tsx
const STATUS_CONFIG = {
  draft:      { label: 'Draft',     class: 'bg-gray-100 text-gray-700' },
  quotation:  { label: 'Quotation', class: 'bg-blue-100 text-blue-700' },
  confirmed:  { label: 'Confirmed', class: 'bg-amber-100 text-amber-700' },
  active:     { label: 'Active',    class: 'bg-green-100 text-green-700' },
  closed:     { label: 'Closed',    class: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, class: 'bg-gray-100' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>{config.label}</span>;
}
```

### Auto-Generated ID Display

> **Note:** `subscription_number` (SUB-2024-00001) and `invoice_number` (INV-2024-00001) are **generated by DB triggers**. Never attempt to create or edit these from the frontend — they arrive read-only in API responses.

Display them prominently in detail views and list tables as the primary human-readable identifier.

---

## Quick Reference — Route to API Mapping

```
/login                        → POST /api/auth/login
/signup                       → POST /api/auth/signup
/verify-email?token=          → GET  /api/auth/verify-email?token=
/set-password?token=          → POST /api/auth/accept-invite
/forgot-password              → POST /api/auth/forgot-password
/reset-password?token=        → POST /api/auth/reset-password

/app/dashboard                → GET  /api/reports/dashboard
/app/products                 → GET  /api/products
/app/products/new             → POST /api/products
/app/products/[id]            → GET  /api/products/:id + /api/products/:id/variants
/app/plans                    → GET  /api/plans
/app/templates                → GET  /api/templates
/app/templates/[id]           → GET  /api/templates/:id (with lines)
/app/discounts                → GET  /api/discounts
/app/subscriptions            → GET  /api/subscriptions
/app/subscriptions/new        → POST /api/subscriptions
/app/subscriptions/[id]       → GET  /api/subscriptions/:id
/app/invoices                 → GET  /api/invoices
/app/invoices/[id]            → GET  /api/invoices/:id + /api/invoices/:id/payment-status
/app/payments                 → GET  /api/payments
/app/reports                  → GET  /api/reports/* (all views)

/admin/users                  → GET /api/auth/internal-users, POST /api/auth/internal-users, PATCH /api/auth/internal-users/:id/toggle
/admin/invitations            → GET /api/auth/invitations
/admin/taxes                  → GET/POST /api/taxes

/portal/subscriptions         → GET  /api/subscriptions/my
/portal/invoices              → GET  /api/invoices/my
/portal/invoices/[id] pay     → POST /api/payments/create-order + /api/payments/verify
```

---

*Subscription Management System — Frontend Reference · Version 1.0 · April 2025*
