# Subscription Management System — Backend API Reference

> **Stack:** Express.js · PostgreSQL · Razorpay · JWT Auth · Nodemailer  
> **Version:** 1.0 · April 2025  
> **Database:** 16 Tables · 5 Reporting Views · 9 Enum Types · 60+ API Endpoints

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema Overview](#4-database-schema-overview)
5. [Environment & Setup](#5-environment--setup)
6. [Authentication Module](#6-authentication-module)
7. [Products Module](#7-products-module)
8. [Taxes Module](#8-taxes-module)
9. [Discounts Module](#9-discounts-module)
10. [Recurring Plans Module](#10-recurring-plans-module)
11. [Quotation Templates Module](#11-quotation-templates-module)
12. [Subscriptions Module](#12-subscriptions-module)
13. [Invoices Module](#13-invoices-module)
14. [Payments & Razorpay Module](#14-payments--razorpay-module)
15. [Reports Module](#15-reports-module)
16. [Role-Based Access Control](#16-role-based-access-control)
17. [Error Handling & Response Format](#17-error-handling--response-format)
18. [Security Checklist](#18-security-checklist)

---

## 1. Project Overview

The **Subscription Management System** is an internal business platform for managing your company's own subscription products, customer billing, invoicing, and payments. It is **not** a third-party aggregator — it is the tool your company uses to run its own subscription business (similar to how Netflix manages its own internal billing, not Netflix itself).

### Business Flow

```
Create Product
      ↓
Attach Recurring Plan + Variants
      ↓
Create Subscription (optionally from Quotation Template)
      ↓
Apply Discounts & Taxes
      ↓
Auto-generate Invoice
      ↓
Record Payment via Razorpay (or manual)
      ↓
Reports & Analytics Dashboard
```

### User Roles

| Role | DB Value | How They Enter the System | Access Level |
|---|---|---|---|
| **Admin** | `'admin'` | Seeded manually via SQL only. No signup API. | Full control — everything |
| **Internal User** | `'internal'` | Admin creates from panel → system sends email invite | Day-to-day operations |
| **Customer** | `'portal'` | Self-registers via public `/signup` | Own subscriptions & invoices only |

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Backend Framework | Express.js (Node.js) — REST API |
| Database | PostgreSQL 15+ with `uuid-ossp` extension |
| Authentication | JWT — Access token (15m) + Refresh token (7d) |
| Password Hashing | bcrypt — cost factor 12 |
| Payment Gateway | Razorpay — orders, payments, signature verification, webhooks |
| Email Service | Nodemailer (SMTP) — Mailtrap for dev, production SMTP for live |
| Input Validation | express-validator or joi |
| Frontend | Next.js + shadcn/ui + Tailwind CSS |

### High-Level Architecture

```
┌─────────────────────────────────┐
│      Next.js Frontend           │
│   shadcn/ui + Tailwind CSS      │
└────────────┬────────────────────┘
             │ HTTP REST API
             ▼
┌─────────────────────────────────┐
│      Express.js Backend         │
│  /api/auth  /api/products       │
│  /api/plans /api/subscriptions  │
│  /api/invoices /api/payments    │
│  /api/reports /api/discounts    │
└────────┬──────────┬─────────────┘
         │          │
         ▼          ▼
┌──────────────┐  ┌─────────────────┐
│  PostgreSQL  │  │    Razorpay     │
│   Database   │  │   Payment API   │
└──────────────┘  └─────────────────┘
```

---

## 3. Folder Structure

```
backend/
├── server.js                    # Entry point, middleware setup, route mounting
├── .env                         # Environment variables (never commit this)
├── .env.example                 # Template for .env
│
├── routes/
│   ├── auth.js                  # Login, signup, invite, password reset
│   ├── products.js              # Products + variants CRUD
│   ├── taxes.js                 # Tax rule management
│   ├── discounts.js             # Discount rules (admin only)
│   ├── plans.js                 # Recurring billing plans
│   ├── templates.js             # Quotation templates
│   ├── subscriptions.js         # Full subscription lifecycle
│   ├── invoices.js              # Invoice generation & management
│   ├── payments.js              # Razorpay + manual payments
│   └── reports.js               # Dashboard & analytics views
│
├── controllers/                 # Business logic — one file per route module
│   ├── authController.js
│   ├── productController.js
│   ├── taxController.js
│   ├── discountController.js
│   ├── planController.js
│   ├── templateController.js
│   ├── subscriptionController.js
│   ├── invoiceController.js
│   ├── paymentController.js
│   └── reportController.js
│
├── middleware/
│   ├── auth.js                  # JWT verification + DB re-validation on every request
│   └── roleCheck.js             # requireRole('admin') / requireRole('admin','internal')
│
├── utils/
│   ├── razorpay.js              # Razorpay SDK instance + signature verifier
│   ├── email.js                 # Nodemailer templates (invite, verify, reset)
│   └── tokenHelpers.js          # Crypto token generation + SHA-256 hashing
│
└── db/
    └── index.js                 # pg Pool instance — single connection pool
```

---

## 4. Database Schema Overview

PostgreSQL schema with **16 tables** organised into 6 logical groups. All primary keys are UUIDs. All mutable tables have `created_at` and `updated_at` (auto-updated via triggers).

### Tables Reference

| # | Table | Group | Purpose |
|---|---|---|---|
| 1 | `users` | Auth | All system users — admin, internal, portal roles |
| 2 | `user_invitations` | Auth | Log of every invite email sent by admin to internal users |
| 3 | `customers` | Auth | Customer profile for portal users (company, address, GSTIN) |
| 4 | `products` | Products | Company products available for subscription |
| 5 | `product_variants` | Products | Attribute-based price variants per product |
| 6 | `taxes` | Config | Configurable GST/tax rules applied on invoices |
| 7 | `discounts` | Config | Admin-only discount rules (fixed/percentage) |
| 8 | `recurring_plans` | Plans | Billing period and behaviour flags for subscriptions |
| 9 | `quotation_templates` | Plans | Reusable templates to speed up subscription creation |
| 10 | `quotation_template_lines` | Plans | Pre-configured product lines inside a template |
| 11 | `subscriptions` | Core | Main subscription records with full lifecycle status |
| 12 | `subscription_lines` | Core | Individual product lines per subscription |
| 13 | `subscription_line_taxes` | Core | Junction table — multiple taxes per subscription line |
| 14 | `invoices` | Billing | Auto-generated from subscriptions |
| 15 | `invoice_lines` | Billing | Product breakdown inside each invoice |
| 16 | `payments` | Billing | Payment records including Razorpay-specific fields |

### PostgreSQL Enum Types (9 total)

```sql
user_role          → 'admin' | 'internal' | 'portal'
billing_period     → 'daily' | 'weekly' | 'monthly' | 'yearly'
subscription_status→ 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed'
invoice_status     → 'draft' | 'confirmed' | 'paid' | 'cancelled'
payment_status     → 'pending' | 'success' | 'failed'
payment_method     → 'razorpay' | 'bank_transfer' | 'cash' | 'other'
discount_type      → 'fixed' | 'percentage'
tax_type           → 'percentage' | 'fixed'
product_type       → 'service' | 'physical' | 'digital' | 'other'
```

### Auto-Generated Human-Readable IDs

> ⚠️ **Never generate these in Express code.** The DB triggers handle it automatically — just omit the field on INSERT.

```
Subscriptions → SUB-2024-00001, SUB-2024-00002 …
Invoices      → INV-2024-00001, INV-2024-00002 …
```

These are generated via PostgreSQL `SEQUENCE` + `BEFORE INSERT` triggers.

---

## 5. Environment & Setup

### 5.1 Environment Variables (`.env`)

```env
# ── Server ──────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── PostgreSQL ───────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=subscription_db
DB_USER=postgres
DB_PASSWORD=your_password

# ── JWT ─────────────────────────────────────────
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_secret_for_refresh_tokens
JWT_REFRESH_EXPIRES_IN=7d

# ── Email (Gmail SMTP with App Password) ─────────
SMTP_SERVICE=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL=no-reply@yourcompany.com

# ── App URL (used in email links) ────────────────
APP_URL=http://localhost:3000

# ── Razorpay ─────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 5.2 Database Setup

```bash
# 1. Create the database
createdb subscription_db

# 2. Run the full schema + seed data (creates all tables, triggers, views, default admin + GST taxes)
psql -U postgres -d subscription_db -f subscription_management_schema.sql

# 3. Generate a real bcrypt hash for the default admin password
node -e "const b=require('bcrypt'); b.hash('Admin@1234',12).then(console.log)"

# 4. Update the admin password hash in the DB (replace <hash> with the output above)
psql -U postgres -d subscription_db \
  -c "UPDATE users SET password_hash='<hash>' WHERE email='admin@company.com';"

# 5. Install backend dependencies
npm install

# 6. Start development server
npm run dev
```

### 5.3 Default Seed Data

After running the schema script, the database contains:

| Seeded Item | Details |
|---|---|
| Admin User | `email: admin@company.com` · `password: Admin@1234` (⚠️ change before production) |
| GST 5% | Tax rate — percentage type |
| GST 12% | Tax rate — percentage type |
| GST 18% | Tax rate — percentage type |
| GST 28% | Tax rate — percentage type |

---

## 6. Authentication Module

All auth uses JWT. Access tokens expire in **15 minutes**, refresh tokens in **7 days**. One-time tokens (invite, reset, verify) are stored as **SHA-256 hashes** — only the raw token lives in the email link, never in the database.

### 6.1 Auth Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login for all roles — admin, internal, portal |
| `POST` | `/api/auth/signup` | Public | Customer self-registration + sends verification email |
| `GET` | `/api/auth/verify-email?token=` | Public | Activate portal account from email link |
| `POST` | `/api/auth/internal-users` | Admin | Admin creates internal user + triggers invite email |
| `POST` | `/api/auth/accept-invite` | Public | Internal user sets password from invite token |
| `POST` | `/api/auth/resend-invite` | Admin | Re-generate and resend expired invite |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset (always returns 200) |
| `POST` | `/api/auth/reset-password` | Public | Set new password using reset token |
| `POST` | `/api/auth/refresh-token` | Public | Exchange refresh token for new access token |
| `GET` | `/api/auth/me` | Any Auth | Get current user profile |

---

### 6.2 User Creation Flows

#### Admin
> Created **only** via the SQL seed script. There is no API endpoint for creating an admin.  
> Login via `POST /api/auth/login` like all other roles.

---

#### Internal User (Employee) — Created by Admin

```
Step 1  Admin → POST /api/auth/internal-users  { name, email }
Step 2  Backend validates email is unique
Step 3  INSERT INTO users (role='internal', password_hash=NULL, created_by=<admin_id>)
Step 4  Generate raw invite token → crypto.randomBytes(32).toString('hex')
Step 5  Hash token → SHA-256 → store hash in users.invite_token
Step 6  Set invite_token_exp = NOW + 48 hours
Step 7  INSERT INTO user_invitations (user_id, invited_by, email, invite_token, expires_at)
Step 8  Send email: "Set your password → APP_URL/set-password?token=<RAW_TOKEN>"
Step 9  Internal user clicks link → POST /api/auth/accept-invite { token, password }
Step 10 Backend: SHA-256 hash the token → find user → check expiry
Step 11 Set password_hash, clear invite_token fields
Step 12 Set is_email_verified=TRUE, invite_accepted_at=NOW()
Step 13 Update user_invitations status='accepted'
Step 14 Return JWT → internal user is now logged in
```

---

#### Customer (Portal User) — Self Registration

```
Step 1  Customer → POST /api/auth/signup  { name, email, password }
Step 2  Validate: unique email + strong password
Step 3  INSERT INTO users (role='portal', created_by=NULL)
Step 4  INSERT INTO customers (user_id=<new_user_id>)
Step 5  Generate verify_token → set verify_token_exp = NOW + 24 hours
Step 6  Send email: "Verify your account → APP_URL/verify-email?token=<TOKEN>"
Step 7  Customer clicks link → GET /api/auth/verify-email?token=<TOKEN>
Step 8  Set is_email_verified=TRUE, clear verify_token
Step 9  Customer can now login via POST /api/auth/login
```

---

### 6.3 `users` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `name` | `VARCHAR(150)` | NO | Full display name |
| `email` | `VARCHAR(255)` | NO | Unique — used for login |
| `password_hash` | `TEXT` | YES | NULL for internal users until invite accepted |
| `role` | `user_role` | NO | `'admin'` · `'internal'` · `'portal'` |
| `is_active` | `BOOLEAN` | NO | FALSE blocks login immediately |
| `is_email_verified` | `BOOLEAN` | NO | Portal: after email verify. Internal: after invite accept |
| `created_by` | `UUID FK` | YES | Admin ID who created this internal user. NULL for admin/portal |
| `reset_token` | `TEXT` | YES | SHA-256 hash of reset token. Cleared after use |
| `reset_token_exp` | `TIMESTAMP` | YES | Expires 1 hour after generation |
| `invite_token` | `TEXT` | YES | SHA-256 hash of invite token (internal users only) |
| `invite_token_exp` | `TIMESTAMP` | YES | Expires 48 hours after admin creates the user |
| `invite_accepted_at` | `TIMESTAMP` | YES | Set when internal user accepts invite |
| `verify_token` | `TEXT` | YES | SHA-256 hash of verify token (portal users only) |
| `verify_token_exp` | `TIMESTAMP` | YES | Expires 24 hours after signup |

### 6.4 `user_invitations` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `user_id` | `UUID FK` | NO | References `users(id)` — CASCADE delete |
| `invited_by` | `UUID FK` | NO | Must be an admin user (enforced at app level) |
| `email` | `VARCHAR(255)` | NO | Email address the invite was sent to |
| `invite_token` | `TEXT` | NO | Raw token string (stored here, hashed on users) |
| `status` | `invite_status` | NO | `'pending'` · `'accepted'` · `'expired'` |
| `expires_at` | `TIMESTAMP` | NO | 48 hours from creation |
| `accepted_at` | `TIMESTAMP` | YES | Set when internal user accepts |

### 6.5 `customers` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `user_id` | `UUID FK` | NO | One-to-one with users. CASCADE delete |
| `company_name` | `VARCHAR(200)` | YES | Optional company name |
| `phone` | `VARCHAR(20)` | YES | Contact phone number |
| `address` | `TEXT` | YES | Street address |
| `city` | `VARCHAR(100)` | YES | City |
| `state` | `VARCHAR(100)` | YES | State |
| `country` | `VARCHAR(100)` | YES | Default: `'India'` |
| `postal_code` | `VARCHAR(20)` | YES | PIN code |
| `gstin` | `VARCHAR(20)` | YES | GST Identification Number for tax compliance |

### 6.6 Key Security Rules

```
✅ Tokens in emails are raw crypto.randomBytes(32) — only SHA-256 hash stored in DB
✅ forgot-password always returns 200 — prevents email enumeration attacks
✅ Password must have: uppercase + lowercase + number + special character
✅ DB trigger (trg_check_internal_user_creator) blocks non-admin from creating internal users
✅ DB re-validation on every protected request — catches suspended users mid-session
✅ Login blocks: inactive account, unaccepted invite, unverified email
```

---

## 7. Products Module

Products are the items your company sells. They can have optional variants with extra pricing (e.g., different tiers or attribute combinations).

### 7.1 Product Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Admin/Internal | List all products (filter: `is_active`, `type`) |
| `POST` | `/api/products` | Admin/Internal | Create a new product |
| `GET` | `/api/products/:id` | Admin/Internal | Get a product with its variants |
| `PUT` | `/api/products/:id` | Admin/Internal | Update product details |
| `PATCH` | `/api/products/:id/toggle` | Admin | Activate / deactivate a product |
| `DELETE` | `/api/products/:id` | Admin | Soft delete — sets `is_active=FALSE` |
| `GET` | `/api/products/:id/variants` | Admin/Internal | List all variants for a product |
| `POST` | `/api/products/:id/variants` | Admin/Internal | Add a variant to a product |
| `PUT` | `/api/products/:id/variants/:vid` | Admin/Internal | Update a variant |
| `DELETE` | `/api/products/:id/variants/:vid` | Admin | Remove a variant |

### 7.2 `products` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `name` | `VARCHAR(200)` | NO | Product name |
| `product_type` | `product_type` | NO | `'service'` · `'physical'` · `'digital'` · `'other'` |
| `description` | `TEXT` | YES | Optional long-form description |
| `sales_price` | `NUMERIC(12,2)` | NO | Base selling price in INR. Must be ≥ 0 |
| `cost_price` | `NUMERIC(12,2)` | NO | Internal cost price for margin tracking. Must be ≥ 0 |
| `is_active` | `BOOLEAN` | NO | FALSE products cannot be added to new subscriptions |
| `created_by` | `UUID FK` | YES | Admin or internal user who created this product |

### 7.3 `product_variants` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `product_id` | `UUID FK` | NO | References `products(id)` — CASCADE on delete |
| `attribute` | `VARCHAR(100)` | NO | Attribute name. Example: `"Brand"`, `"Plan Tier"` |
| `value` | `VARCHAR(100)` | NO | Attribute value. Example: `"Odoo"`, `"Pro"` |
| `extra_price` | `NUMERIC(12,2)` | NO | Added on top of base `sales_price`. Must be ≥ 0 |
| `is_active` | `BOOLEAN` | NO | Can be toggled independently of parent product |

> **Pricing Rule:** Final line price = `product.sales_price` + `variant.extra_price` (if variant selected). Variants are optional.

---

## 8. Taxes Module

Configurable tax rules applied during invoice generation. Default seed includes Indian GST rates (5%, 12%, 18%, 28%). Multiple taxes can be applied to a single subscription line via the `subscription_line_taxes` junction table.

### 8.1 Tax Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/taxes` | Admin/Internal | List all taxes (filter by `is_active`) |
| `POST` | `/api/taxes` | Admin | Create a new tax rule |
| `GET` | `/api/taxes/:id` | Admin/Internal | Get a single tax rule |
| `PUT` | `/api/taxes/:id` | Admin | Update a tax rule |
| `PATCH` | `/api/taxes/:id/toggle` | Admin | Activate / deactivate a tax |
| `DELETE` | `/api/taxes/:id` | Admin | Delete (blocked if currently in use on any line) |

### 8.2 `taxes` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `name` | `VARCHAR(100)` | NO | Display name. Example: `"GST 18%"` |
| `type` | `tax_type` | NO | `'percentage'` · `'fixed'` |
| `rate` | `NUMERIC(8,4)` | NO | Percentage: `18.00` = 18%. Fixed: rupee amount. Must be > 0 |
| `description` | `TEXT` | YES | Notes about when this tax applies |
| `is_active` | `BOOLEAN` | NO | Only active taxes appear in UI dropdowns |
| `created_by` | `UUID FK` | YES | User who created this tax rule |

---

## 9. Discounts Module

Discount rules with fixed (₹) or percentage (%) values. **Only Admin can create discounts** — enforced at API middleware level AND via a PostgreSQL trigger (`trg_check_discount_creator`), so even direct DB access cannot bypass this rule.

### 9.1 Discount Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/discounts` | Admin/Internal | List all discounts with filters |
| `POST` | `/api/discounts` | Admin | Create a new discount rule |
| `GET` | `/api/discounts/:id` | Admin/Internal | Get discount details with `usage_count` |
| `PUT` | `/api/discounts/:id` | Admin | Update a discount rule |
| `PATCH` | `/api/discounts/:id/toggle` | Admin | Activate / deactivate a discount |
| `DELETE` | `/api/discounts/:id` | Admin | Delete (blocked if `usage_count > 0`) |

### 9.2 `discounts` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `name` | `VARCHAR(150)` | NO | Descriptive name. Example: `"Q1 Startup Offer"` |
| `created_by` | `UUID FK` | NO | Admin UUID — enforced at DB level via trigger |
| `type` | `discount_type` | NO | `'fixed'` · `'percentage'` |
| `value` | `NUMERIC(12,2)` | NO | ₹ amount (fixed) or % value (percentage). Must be > 0 |
| `min_purchase` | `NUMERIC(12,2)` | YES | Minimum order value to qualify. Default 0 |
| `min_quantity` | `INTEGER` | YES | Minimum quantity required. Default 1 |
| `start_date` | `DATE` | YES | Valid from this date. NULL = no start restriction |
| `end_date` | `DATE` | YES | Expires after this date. NULL = no expiry |
| `usage_limit` | `INTEGER` | YES | Max total uses. NULL = unlimited |
| `usage_count` | `INTEGER` | NO | Running count of how many times this was applied |
| `applies_to_products` | `BOOLEAN` | NO | Can be applied on product lines |
| `applies_to_subscriptions` | `BOOLEAN` | NO | Can be applied on overall subscription total |
| `is_active` | `BOOLEAN` | NO | Only active discounts appear in UI |

### 9.3 Discount Application Logic

```
1. Check is_active = TRUE
2. Check current date is within start_date and end_date range
3. Check usage_count < usage_limit (if a limit is set)
4. Check order meets min_purchase and min_quantity thresholds
5. Calculate:
   - Percentage → discount_amount = (unit_price × qty) × (value / 100)
   - Fixed      → discount_amount = value (capped at line subtotal)
6. Increment usage_count atomically after successful application
```

---

## 10. Recurring Plans Module

Recurring plans define billing rules — how often a customer is charged and behavioural flags (auto-close, pausable, renewable). Every subscription must be linked to a plan.

### 10.1 Recurring Plans Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/plans` | Admin/Internal | List all plans (filter by `billing_period`, `is_active`) |
| `POST` | `/api/plans` | Admin/Internal | Create a new recurring plan |
| `GET` | `/api/plans/:id` | Admin/Internal | Get plan details with linked subscription count |
| `PUT` | `/api/plans/:id` | Admin/Internal | Update plan details |
| `PATCH` | `/api/plans/:id/toggle` | Admin | Activate / deactivate a plan |
| `DELETE` | `/api/plans/:id` | Admin | Delete (blocked if subscriptions are linked) |

### 10.2 `recurring_plans` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `name` | `VARCHAR(150)` | NO | Plan display name. Example: `"Monthly Pro Plan"` |
| `price` | `NUMERIC(12,2)` | NO | Recurring charge amount in INR. Must be ≥ 0 |
| `billing_period` | `billing_period` | NO | `'daily'` · `'weekly'` · `'monthly'` · `'yearly'` |
| `min_quantity` | `INTEGER` | NO | Minimum subscription quantity. Default 1 |
| `start_date` | `DATE` | YES | Available from this date. NULL = always available |
| `end_date` | `DATE` | YES | Expires after this date. NULL = no expiry |
| `auto_close` | `BOOLEAN` | NO | If TRUE, subscription auto-closes at `expiration_date` |
| `closable` | `BOOLEAN` | NO | If FALSE, subscription cannot be manually closed early |
| `pausable` | `BOOLEAN` | NO | If TRUE, customers can request pauses |
| `renewable` | `BOOLEAN` | NO | If TRUE, subscription can be renewed/extended |
| `is_active` | `BOOLEAN` | NO | Only active plans can be used for new subscriptions |

---

## 11. Quotation Templates Module

Pre-built templates that speed up subscription creation. A template combines a recurring plan with pre-configured product lines. When creating a subscription, staff can pick a template to auto-fill all lines.

### 11.1 Quotation Template Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/templates` | Admin/Internal | List all templates (with line count) |
| `POST` | `/api/templates` | Admin/Internal | Create template with optional product lines |
| `GET` | `/api/templates/:id` | Admin/Internal | Get template with all product lines |
| `PUT` | `/api/templates/:id` | Admin/Internal | Update template details |
| `PATCH` | `/api/templates/:id/toggle` | Admin | Activate / deactivate a template |
| `DELETE` | `/api/templates/:id` | Admin | Delete (blocked if linked to subscriptions) |
| `POST` | `/api/templates/:id/lines` | Admin/Internal | Add a product line to a template |
| `PUT` | `/api/templates/:id/lines/:lid` | Admin/Internal | Update a template line |
| `DELETE` | `/api/templates/:id/lines/:lid` | Admin/Internal | Remove a line from a template |

### 11.2 Table Schemas

#### `quotation_templates`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `name` | `VARCHAR(150)` | NO | Template name. Example: `"Annual Enterprise Package"` |
| `validity_days` | `INTEGER` | NO | Days the generated quotation stays valid. Default 30 |
| `recurring_plan_id` | `UUID FK` | YES | Linked plan. NULL allowed — plan can be set at subscription time |
| `is_active` | `BOOLEAN` | NO | Only active templates appear in subscription creation UI |
| `created_by` | `UUID FK` | YES | User who created this template |

#### `quotation_template_lines`

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `template_id` | `UUID FK` | NO | References `quotation_templates(id)` — CASCADE delete |
| `product_id` | `UUID FK` | NO | References `products(id)` — RESTRICT delete |
| `quantity` | `INTEGER` | NO | Default quantity. Must be > 0 |
| `unit_price` | `NUMERIC(12,2)` | NO | Snapshot of price at template creation time |

---

## 12. Subscriptions Module

The core of the system. Links a customer to a recurring plan and tracks the full lifecycle from draft to closed.

### 12.1 Subscription Status Lifecycle

```
draft  →  quotation  →  confirmed  →  active  →  closed
```

| Status | Meaning |
|---|---|
| `draft` | Being built by staff. Not visible to customer yet |
| `quotation` | Sent to customer for review. Validity tracked by `validity_days` |
| `confirmed` | Customer approved. Invoicing can begin |
| `active` | Running subscription. Recurring invoices generated automatically |
| `closed` | Subscription ended. No new invoices. Historical record preserved |

### 12.2 Subscription Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/subscriptions` | Admin/Internal | List all (filter: `status`, `customer`, `plan`) |
| `POST` | `/api/subscriptions` | Admin/Internal | Create new (optionally from a template) |
| `GET` | `/api/subscriptions/:id` | Admin/Internal | Full detail — lines, taxes, discounts |
| `PUT` | `/api/subscriptions/:id` | Admin/Internal | Update (only allowed in `draft`/`quotation` status) |
| `PATCH` | `/api/subscriptions/:id/status` | Admin/Internal | Transition status along lifecycle |
| `POST` | `/api/subscriptions/:id/lines` | Admin/Internal | Add a product line |
| `PUT` | `/api/subscriptions/:id/lines/:lid` | Admin/Internal | Update a line (qty, price, discount, taxes) |
| `DELETE` | `/api/subscriptions/:id/lines/:lid` | Admin/Internal | Remove a product line |
| `POST` | `/api/subscriptions/:id/invoice` | Admin/Internal | Generate an invoice from this subscription |
| `GET` | `/api/subscriptions/customer/:cid` | Any Auth | All subscriptions for a specific customer |
| `GET` | `/api/subscriptions/my` | Portal | Customer views their own subscriptions only |

### 12.3 `subscriptions` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `subscription_number` | `VARCHAR(50)` | NO | **Auto-generated by DB trigger** — `SUB-2024-00001`. Never set from backend |
| `customer_id` | `UUID FK` | NO | References `customers(id)` — RESTRICT delete |
| `plan_id` | `UUID FK` | YES | References `recurring_plans(id)` — RESTRICT delete |
| `template_id` | `UUID FK` | YES | Template used to create this. NULL if not from template |
| `start_date` | `DATE` | NO | Billing start date |
| `expiration_date` | `DATE` | YES | When subscription ends. NULL = open-ended |
| `payment_terms` | `VARCHAR(100)` | YES | e.g., `"Net 30"`, `"Due on receipt"` |
| `status` | `subscription_status` | NO | Enum — see lifecycle above. Default: `'draft'` |
| `notes` | `TEXT` | YES | Internal staff notes |
| `created_by` | `UUID FK` | YES | Staff user who created this subscription |

### 12.4 `subscription_lines` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `subscription_id` | `UUID FK` | NO | References `subscriptions(id)` — CASCADE delete |
| `product_id` | `UUID FK` | NO | References `products(id)` — RESTRICT delete |
| `variant_id` | `UUID FK` | YES | Optional variant — contributes `extra_price` |
| `discount_id` | `UUID FK` | YES | Optional discount applied to this line only |
| `quantity` | `INTEGER` | NO | Item quantity. Must be > 0 |
| `unit_price` | `NUMERIC(12,2)` | NO | Price per unit at subscription creation time (snapshot) |
| `tax_amount` | `NUMERIC(12,2)` | NO | Sum of taxes from `subscription_line_taxes` |
| `discount_amount` | `NUMERIC(12,2)` | NO | Discount applied to this line |
| `total_amount` | `NUMERIC(12,2)` | NO | `(unit_price × qty) + tax_amount − discount_amount` |

### 12.5 `subscription_line_taxes` Junction Table

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `subscription_line_id` | `UUID FK` | NO | References `subscription_lines(id)` — CASCADE delete |
| `tax_id` | `UUID FK` | NO | References `taxes(id)` — RESTRICT delete |
| — | UNIQUE | — | `(subscription_line_id, tax_id)` — no duplicate taxes per line |

---

## 13. Invoices Module

Invoices are generated from confirmed/active subscriptions. The DB trigger assigns invoice numbers automatically. An invoice tracks the full financial breakdown and links to payments separately.

### 13.1 Invoice Status Lifecycle

```
draft  →  confirmed  →  paid
              ↓
          cancelled
```

| Status | Meaning |
|---|---|
| `draft` | Created but not yet sent. Can still be edited |
| `confirmed` | Finalised and sent to customer. Ready for payment |
| `paid` | All payments recorded against this invoice |
| `cancelled` | Voided. Allowed only in `draft` or `confirmed` status |

### 13.2 Invoice Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | Admin/Internal | List all (filter: `status`, `customer`, date range) |
| `POST` | `/api/invoices` | Admin/Internal | Manually create an invoice from a subscription |
| `GET` | `/api/invoices/:id` | Admin/Internal | Full invoice with lines and payment summary |
| `PATCH` | `/api/invoices/:id/confirm` | Admin/Internal | Move from `draft` → `confirmed` |
| `PATCH` | `/api/invoices/:id/cancel` | Admin | Cancel (only in `draft` or `confirmed`) |
| `GET` | `/api/invoices/:id/payment-status` | Admin/Internal | Check total paid vs outstanding amount |
| `GET` | `/api/invoices/customer/:cid` | Any Auth | All invoices for a specific customer |
| `GET` | `/api/invoices/my` | Portal | Customer views their own invoices only |

### 13.3 `invoices` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `invoice_number` | `VARCHAR(50)` | NO | **Auto-generated by DB trigger** — `INV-2024-00001`. Never set from backend |
| `subscription_id` | `UUID FK` | NO | References `subscriptions(id)` — RESTRICT delete |
| `customer_id` | `UUID FK` | NO | References `customers(id)` — RESTRICT delete |
| `status` | `invoice_status` | NO | `'draft'` · `'confirmed'` · `'paid'` · `'cancelled'` |
| `subtotal` | `NUMERIC(12,2)` | NO | Sum of all line totals before tax and discount |
| `tax_total` | `NUMERIC(12,2)` | NO | Sum of all tax amounts across all lines |
| `discount_total` | `NUMERIC(12,2)` | NO | Sum of all discount amounts across all lines |
| `grand_total` | `NUMERIC(12,2)` | NO | `subtotal + tax_total − discount_total` |
| `due_date` | `DATE` | YES | Payment deadline. Used for overdue tracking in reports |
| `issued_date` | `DATE` | NO | Date invoice was created. Default: `CURRENT_DATE` |
| `sent_at` | `TIMESTAMP` | YES | Set when invoice email is sent to customer |
| `confirmed_at` | `TIMESTAMP` | YES | Set when status transitions to `confirmed` |
| `cancelled_at` | `TIMESTAMP` | YES | Set when status transitions to `cancelled` |
| `notes` | `TEXT` | YES | Notes visible on the printed invoice |
| `created_by` | `UUID FK` | YES | Staff user who created this invoice |

### 13.4 `invoice_lines` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `invoice_id` | `UUID FK` | NO | References `invoices(id)` — CASCADE delete |
| `product_id` | `UUID FK` | NO | References `products(id)` — RESTRICT delete |
| `description` | `TEXT` | YES | Line item description shown on invoice |
| `quantity` | `INTEGER` | NO | Must be > 0 |
| `unit_price` | `NUMERIC(12,2)` | NO | Price per unit at time of invoice generation |
| `tax_amount` | `NUMERIC(12,2)` | NO | Tax applied to this line |
| `discount_amount` | `NUMERIC(12,2)` | NO | Discount applied to this line |
| `line_total` | `NUMERIC(12,2)` | NO | `(unit_price × qty) + tax_amount − discount_amount` |

---

## 14. Payments & Razorpay Module

Payments settle invoices. Razorpay is the primary gateway supporting UPI, cards, netbanking, and wallets. Bank transfer and cash are available as manual alternatives. **Signature must always be verified server-side before marking any payment as successful.**

### 14.1 Payment Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments/create-order` | Portal/Admin | Create Razorpay order for an invoice — returns `order_id` |
| `POST` | `/api/payments/verify` | Portal/Admin | Verify Razorpay signature + mark invoice as paid |
| `POST` | `/api/payments/webhook` | Razorpay | Webhook handler — fallback if browser closes during payment |
| `POST` | `/api/payments/manual` | Admin/Internal | Record a manual payment (bank transfer / cash) |
| `GET` | `/api/payments` | Admin/Internal | List all payments (filter: `status`, `method`, date range) |
| `GET` | `/api/payments/:id` | Admin/Internal | Get payment details including Razorpay IDs |
| `GET` | `/api/payments/invoice/:iid` | Any Auth | All payments for a specific invoice |

### 14.2 Razorpay Integration Flow

```
Step 1   User clicks "Pay Now" on a confirmed invoice (Next.js frontend)
          ↓
Step 2   Frontend calls → POST /api/payments/create-order { invoice_id }
          ↓
Step 3   Backend: razorpay.orders.create({ amount_in_paise, currency: 'INR', receipt: invoice_number })
         Returns { order_id, amount, currency } to frontend
          ↓
Step 4   Frontend opens Razorpay checkout popup (key_id, order_id, amount, prefill)
          ↓
Step 5   Customer pays via UPI / Card / NetBanking / Wallet
          ↓
Step 6   Razorpay calls handler({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
          ↓
Step 7   Frontend calls → POST /api/payments/verify { order_id, payment_id, signature, invoice_id }
          ↓
Step 8   Backend verifies HMAC-SHA256 signature (see code below)
         On success → INSERT into payments (status='success') → UPDATE invoice status='paid'
          ↓
Step 9   Webhook (POST /api/payments/webhook) acts as fallback
         Handles payment.captured / payment.failed events if browser closes before Step 7
```

### 14.3 Signature Verification (Critical — Never Skip)

```javascript
const crypto = require('crypto');

function verifyRazorpaySignature(order_id, payment_id, signature) {
  const body = `${order_id}|${payment_id}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// Only if isValid === true → record payment + mark invoice as paid
```

### 14.4 `payments` Table Schema

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | `UUID PK` | NO | Auto-generated UUID |
| `invoice_id` | `UUID FK` | NO | References `invoices(id)` — RESTRICT delete |
| `customer_id` | `UUID FK` | NO | References `customers(id)` — RESTRICT delete |
| `amount` | `NUMERIC(12,2)` | NO | Amount paid in INR. Must be > 0 |
| `payment_method` | `payment_method` | NO | `'razorpay'` · `'bank_transfer'` · `'cash'` · `'other'` |
| `payment_date` | `DATE` | NO | Date payment received. Default: `CURRENT_DATE` |
| `status` | `payment_status` | NO | `'pending'` · `'success'` · `'failed'` |
| `razorpay_order_id` | `VARCHAR(100)` | YES | Order ID from `razorpay.orders.create()` — used for webhook matching |
| `razorpay_payment_id` | `VARCHAR(100)` | YES | Payment ID returned after successful Razorpay payment |
| `razorpay_signature` | `TEXT` | YES | HMAC-SHA256 signature — verified before recording success |
| `reference_number` | `VARCHAR(100)` | YES | For bank_transfer/cash: cheque number or transfer ref |
| `notes` | `TEXT` | YES | Internal notes about this payment |

---

## 15. Reports Module

The reports module exposes the pre-built PostgreSQL views as API endpoints. All views use optimised JOIN strategies and aggregations — no N+1 queries, no computation needed in Express controllers.

### 15.1 Report Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports/dashboard` | Admin/Internal | KPIs: active subs, monthly revenue, overdue invoices, pending payments |
| `GET` | `/api/reports/active-subscriptions` | Admin/Internal | Full list from `v_active_subscriptions` view |
| `GET` | `/api/reports/invoice-summary` | Admin/Internal | Invoice list from `v_invoice_summary` with paid/outstanding amounts |
| `GET` | `/api/reports/monthly-revenue` | Admin/Internal | Monthly revenue from `v_monthly_revenue` view |
| `GET` | `/api/reports/overdue-invoices` | Admin/Internal | Overdue list from `v_overdue_invoices` sorted by `days_overdue` |
| `GET` | `/api/reports/pending-invitations` | Admin | Pending invites from `v_pending_invitations` with expiry status |

### 15.2 Database Views Reference

| View Name | What It Returns |
|---|---|
| `v_active_subscriptions` | Subscriptions with `status='active'` — includes customer name, email, company, plan name, billing period, price |
| `v_invoice_summary` | All invoices with `amount_paid` and `amount_outstanding` calculated by summing successful payments |
| `v_monthly_revenue` | Aggregated revenue from `payments` where `status='success'`, grouped by `DATE_TRUNC('month')` |
| `v_overdue_invoices` | Confirmed invoices where `due_date < CURRENT_DATE` — includes `days_overdue`, sorted most overdue first |
| `v_pending_invitations` | Pending `user_invitations` with invited user name, admin name, expiry, and `is_expired` flag |

---

## 16. Role-Based Access Control

Three middleware layers enforce access on every protected route:
1. **JWT Verification** — validates the token signature and expiry
2. **DB Re-validation** — re-queries the `users` table to catch suspended/deleted users mid-session
3. **Role Guard** — `requireRole('admin')` or `requireRole('admin', 'internal')` per route

### Full Permission Matrix

| Capability | Admin | Internal | Customer (Portal) |
|---|---|---|---|
| Login | ✅ | ✅ | ✅ |
| View own profile (`/me`) | ✅ | ✅ | ✅ |
| Create Internal Users | ✅ | ❌ | ❌ |
| Resend Invite | ✅ | ❌ | ❌ |
| View / Manage Products | ✅ | ✅ | ❌ |
| Create / Edit Taxes | ✅ | ❌ | ❌ |
| Create / Edit Discounts | ✅ | ❌ | ❌ |
| Manage Recurring Plans | ✅ | ✅ | ❌ |
| Manage Quotation Templates | ✅ | ✅ | ❌ |
| Create / Edit Subscriptions | ✅ | ✅ | ❌ |
| View Own Subscriptions | ❌ | ❌ | ✅ |
| Confirm / Close Subscriptions | ✅ | ✅ | ❌ |
| Generate / Confirm Invoices | ✅ | ✅ | ❌ |
| View Own Invoices | ❌ | ❌ | ✅ |
| Initiate Razorpay Payment | ✅ | ✅ | ✅ |
| Record Manual Payment | ✅ | ✅ | ❌ |
| View Reports & Dashboard | ✅ | ✅ | ❌ |
| View Pending Invitations | ✅ | ❌ | ❌ |

---

## 17. Error Handling & Response Format

### 17.1 Standard Response Envelope

```javascript
// ── Success (single resource) ──────────────────────────
{
  "success": true,
  "message": "Product created successfully",
  "data": { "id": "uuid...", "name": "Pro Plan", ... }
}

// ── Success (list with pagination) ────────────────────
{
  "success": true,
  "data": [ { ... }, { ... } ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}

// ── Error ─────────────────────────────────────────────
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Email is already in use" }
  ]
}
```

### 17.2 HTTP Status Codes

| Code | Scenario |
|---|---|
| `200 OK` | Successful GET, PUT, PATCH, DELETE |
| `201 Created` | Successful POST — resource created |
| `400 Bad Request` | Validation errors, missing required fields, invalid enum values |
| `401 Unauthorized` | No token, expired access token, or invalid token |
| `403 Forbidden` | Valid token but insufficient role for this route |
| `404 Not Found` | Resource does not exist or not accessible to this user |
| `409 Conflict` | Duplicate email, unique constraint violation |
| `422 Unprocessable` | Business logic error (e.g., can't delete plan with active subscriptions) |
| `500 Internal Error` | Unexpected server or database error |

---

## 18. Security Checklist

| # | Requirement | Status |
|---|---|---|
| 1 | JWT access tokens expire in 15 minutes | ✅ |
| 2 | JWT refresh tokens expire in 7 days | ✅ |
| 3 | All one-time tokens (invite, reset, verify) stored as SHA-256 hashes only | ✅ |
| 4 | Raw token lives only in the email URL — never in the database | ✅ |
| 5 | Invite token TTL: 48h · Verify token TTL: 24h · Reset token TTL: 1h | ✅ |
| 6 | `forgot-password` always returns HTTP 200 — prevents email enumeration | ✅ |
| 7 | Razorpay signature verified via `crypto.timingSafeEqual()` before recording payment | ✅ |
| 8 | DB trigger `trg_check_internal_user_creator` blocks non-admin from creating internal users | ✅ |
| 9 | DB trigger `trg_check_discount_creator` blocks non-admin from creating discounts | ✅ |
| 10 | DB re-validation on every protected request — catches deleted/suspended users mid-session | ✅ |
| 11 | Password requires: uppercase + lowercase + number + special character (min 8 chars) | ✅ |
| 12 | bcrypt cost factor 12 for all password hashes | ✅ |
| 13 | Portal users can ONLY see their own data — `customer_id = req.user.customer_id` enforced server-side | ✅ |
| 14 | Razorpay webhook verified via `X-Razorpay-Signature` header before processing any event | ✅ |
| 15 | All DB queries use parameterised `pg` queries — no string concatenation, no SQL injection risk | ✅ |
| 16 | CORS configured to allow only the Next.js frontend origin in production | ✅ |
| 17 | `helmet.js` sets secure HTTP headers (XSS protection, HSTS, CSP, etc.) | ✅ |

---

## Quick Reference — Database Triggers

| Trigger Name | Table | Event | What It Does |
|---|---|---|---|
| `set_updated_at_*` | All mutable tables | `BEFORE UPDATE` | Auto-sets `updated_at = NOW()` |
| `trg_subscription_number` | `subscriptions` | `BEFORE INSERT` | Generates `SUB-YYYY-NNNNN` format number |
| `trg_invoice_number` | `invoices` | `BEFORE INSERT` | Generates `INV-YYYY-NNNNN` format number |
| `trg_check_internal_user_creator` | `users` | `BEFORE INSERT` | Validates only admin can create internal users. Blocks portal/admin from having `created_by` |
| `trg_check_discount_creator` | `discounts` | `BEFORE INSERT` | Validates creator is an admin user |

---

## Quick Reference — All API Endpoints

```
AUTH
  POST   /api/auth/login
  POST   /api/auth/signup
  GET    /api/auth/verify-email?token=
  POST   /api/auth/internal-users
  POST   /api/auth/accept-invite
  POST   /api/auth/resend-invite
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password
  POST   /api/auth/refresh-token
  GET    /api/auth/me

PRODUCTS
  GET    /api/products
  POST   /api/products
  GET    /api/products/:id
  PUT    /api/products/:id
  PATCH  /api/products/:id/toggle
  DELETE /api/products/:id
  GET    /api/products/:id/variants
  POST   /api/products/:id/variants
  PUT    /api/products/:id/variants/:vid
  DELETE /api/products/:id/variants/:vid

TAXES
  GET    /api/taxes
  POST   /api/taxes
  GET    /api/taxes/:id
  PUT    /api/taxes/:id
  PATCH  /api/taxes/:id/toggle
  DELETE /api/taxes/:id

DISCOUNTS
  GET    /api/discounts
  POST   /api/discounts
  GET    /api/discounts/:id
  PUT    /api/discounts/:id
  PATCH  /api/discounts/:id/toggle
  DELETE /api/discounts/:id

RECURRING PLANS
  GET    /api/plans
  POST   /api/plans
  GET    /api/plans/:id
  PUT    /api/plans/:id
  PATCH  /api/plans/:id/toggle
  DELETE /api/plans/:id

QUOTATION TEMPLATES
  GET    /api/templates
  POST   /api/templates
  GET    /api/templates/:id
  PUT    /api/templates/:id
  PATCH  /api/templates/:id/toggle
  DELETE /api/templates/:id
  POST   /api/templates/:id/lines
  PUT    /api/templates/:id/lines/:lid
  DELETE /api/templates/:id/lines/:lid

SUBSCRIPTIONS
  GET    /api/subscriptions
  POST   /api/subscriptions
  GET    /api/subscriptions/:id
  PUT    /api/subscriptions/:id
  PATCH  /api/subscriptions/:id/status
  POST   /api/subscriptions/:id/lines
  PUT    /api/subscriptions/:id/lines/:lid
  DELETE /api/subscriptions/:id/lines/:lid
  POST   /api/subscriptions/:id/invoice
  GET    /api/subscriptions/customer/:cid
  GET    /api/subscriptions/my

INVOICES
  GET    /api/invoices
  POST   /api/invoices
  GET    /api/invoices/:id
  PATCH  /api/invoices/:id/confirm
  PATCH  /api/invoices/:id/cancel
  GET    /api/invoices/:id/payment-status
  GET    /api/invoices/customer/:cid
  GET    /api/invoices/my

PAYMENTS
  POST   /api/payments/create-order
  POST   /api/payments/verify
  POST   /api/payments/webhook
  POST   /api/payments/manual
  GET    /api/payments
  GET    /api/payments/:id
  GET    /api/payments/invoice/:iid

REPORTS
  GET    /api/reports/dashboard
  GET    /api/reports/active-subscriptions
  GET    /api/reports/invoice-summary
  GET    /api/reports/monthly-revenue
  GET    /api/reports/overdue-invoices
  GET    /api/reports/pending-invitations
```

---

*Subscription Management System — Backend API Reference · Version 1.0 · April 2025*
