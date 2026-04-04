-- ============================================================
--   SUBSCRIPTION MANAGEMENT SYSTEM — PostgreSQL Schema
--   Full database script with tables, constraints, indexes
-- ============================================================
--
--  USER CREATION LOGIC:
--  ┌─────────────────────────────────────────────────────────┐
--  │  ADMIN       → Created manually via this SQL seed       │
--  │  INTERNAL    → Created by Admin inside Admin Panel      │
--  │                Email sent automatically to internal user│
--  │  PORTAL/CUSTOMER → Self-registers via public Signup     │
--  └─────────────────────────────────────────────────────────┘
--
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'internal', 'portal');

CREATE TYPE billing_period AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

CREATE TYPE subscription_status AS ENUM ('draft', 'quotation', 'confirmed', 'active', 'closed');

CREATE TYPE invoice_status AS ENUM ('draft', 'confirmed', 'paid', 'cancelled');

CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');

CREATE TYPE payment_method AS ENUM ('razorpay', 'bank_transfer', 'cash', 'other');

CREATE TYPE discount_type AS ENUM ('fixed', 'percentage');

CREATE TYPE tax_type AS ENUM ('percentage', 'fixed');

CREATE TYPE product_type AS ENUM ('service', 'physical', 'digital', 'other');

CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');


-- ============================================================
-- 1. USERS
-- ============================================================
-- HOW EACH ROLE IS CREATED:
--   admin    → Only via manual DB seed (this script). Never via API signup.
--   internal → Only via Admin Panel. Admin fills name+email → system creates
--              account → sends invite email with set-password link.
--   portal   → Only via public /signup API. Self-registration by customers.
-- ============================================================

CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(150)    NOT NULL,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    password_hash       TEXT,                          -- NULL until internal user sets password via invite link
    role                user_role       NOT NULL DEFAULT 'portal',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Who created this user (only populated for internal users, set by admin)
    created_by          UUID            REFERENCES users(id) ON DELETE SET NULL,

    -- Password reset flow (for all roles)
    reset_token         TEXT,
    reset_token_exp     TIMESTAMP,

    -- Invite flow (only for internal users created by admin)
    invite_token        TEXT,
    invite_token_exp    TIMESTAMP,
    invite_accepted_at  TIMESTAMP,

    -- Email verification (for portal/customer signup)
    verify_token        TEXT,
    verify_token_exp    TIMESTAMP,

    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_users_created_by      ON users(created_by);
CREATE INDEX idx_users_invite_token    ON users(invite_token);
CREATE INDEX idx_users_reset_token     ON users(reset_token);
CREATE INDEX idx_users_verify_token    ON users(verify_token);

COMMENT ON TABLE  users                    IS 'All system users: admin, internal, and portal/customer';
COMMENT ON COLUMN users.password_hash      IS 'NULL for internal users until they accept invite and set password';
COMMENT ON COLUMN users.created_by         IS 'Admin user ID who created this internal user. NULL for admin and portal users';
COMMENT ON COLUMN users.invite_token       IS 'One-time token sent via email to internal users to set their password';
COMMENT ON COLUMN users.invite_token_exp   IS 'Invite link expires after 48 hours';
COMMENT ON COLUMN users.is_email_verified  IS 'TRUE after portal user verifies email, or internal user accepts invite';


-- ============================================================
-- 2. INTERNAL USER INVITATIONS LOG
-- ============================================================
-- Tracks every invite email sent by admin to internal users.
-- Useful for resending invites, auditing, and expiry checks.
-- ============================================================

CREATE TABLE user_invitations (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by      UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    email           VARCHAR(255)    NOT NULL,
    invite_token    TEXT            NOT NULL,
    status          invite_status   NOT NULL DEFAULT 'pending',
    expires_at      TIMESTAMP       NOT NULL,
    accepted_at     TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_user_id      ON user_invitations(user_id);
CREATE INDEX idx_invitations_invited_by   ON user_invitations(invited_by);
CREATE INDEX idx_invitations_status       ON user_invitations(status);
CREATE INDEX idx_invitations_token        ON user_invitations(invite_token);

COMMENT ON TABLE  user_invitations             IS 'Log of all invite emails sent by admin to internal users';
COMMENT ON COLUMN user_invitations.invited_by  IS 'Must always be an admin user (enforced at app level)';
COMMENT ON COLUMN user_invitations.expires_at  IS 'Token expires 48 hours after creation';


-- ============================================================
-- 3. CUSTOMERS
-- ============================================================
-- Only created for portal (customer) users via signup flow.
-- Admin and Internal users do NOT have a customer profile.
-- ============================================================

CREATE TABLE customers (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name    VARCHAR(200),
    phone           VARCHAR(20),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    country         VARCHAR(100)    DEFAULT 'India',
    postal_code     VARCHAR(20),
    gstin           VARCHAR(20),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);

COMMENT ON TABLE  customers       IS 'Customer profile for portal users only. Created automatically on signup.';
COMMENT ON COLUMN customers.gstin IS 'GST Identification Number for Indian tax compliance';


-- ============================================================
-- 4. PRODUCTS
-- ============================================================

CREATE TABLE products (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200)    NOT NULL,
    product_type    product_type    NOT NULL DEFAULT 'service',
    description     TEXT,
    sales_price     NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    cost_price      NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by      UUID            REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_product_sales_price CHECK (sales_price >= 0),
    CONSTRAINT chk_product_cost_price  CHECK (cost_price >= 0)
);

CREATE INDEX idx_products_name      ON products(name);
CREATE INDEX idx_products_is_active ON products(is_active);

COMMENT ON TABLE products IS 'Company products that can be subscribed to. Managed by admin/internal users.';


-- ============================================================
-- 5. PRODUCT VARIANTS
-- ============================================================

CREATE TABLE product_variants (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID            NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute       VARCHAR(100)    NOT NULL,
    value           VARCHAR(100)    NOT NULL,
    extra_price     NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_variant_extra_price CHECK (extra_price >= 0)
);

CREATE INDEX idx_variants_product_id ON product_variants(product_id);

COMMENT ON TABLE  product_variants             IS 'Attribute-based pricing variants per product';
COMMENT ON COLUMN product_variants.extra_price IS 'Added on top of base product sales_price';


-- ============================================================
-- 6. TAXES
-- ============================================================

CREATE TABLE taxes (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100)    NOT NULL,
    type            tax_type        NOT NULL DEFAULT 'percentage',
    rate            NUMERIC(8,4)    NOT NULL,
    description     TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by      UUID            REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tax_rate_positive CHECK (rate > 0)
);

CREATE INDEX idx_taxes_is_active ON taxes(is_active);

COMMENT ON TABLE  taxes      IS 'Configurable tax rules applied on invoice and subscription lines';
COMMENT ON COLUMN taxes.rate IS 'For percentage type: 18.00 = 18%. For fixed: rupee amount.';


-- ============================================================
-- 7. DISCOUNTS
-- ============================================================
-- Rule: Only Admin can create discounts (enforced at app + DB level).
-- ============================================================

CREATE TABLE discounts (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(150)    NOT NULL,
    created_by                  UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type                        discount_type   NOT NULL,
    value                       NUMERIC(12,2)   NOT NULL,
    min_purchase                NUMERIC(12,2)   DEFAULT 0.00,
    min_quantity                INTEGER         DEFAULT 1,
    start_date                  DATE,
    end_date                    DATE,
    usage_limit                 INTEGER,
    usage_count                 INTEGER         NOT NULL DEFAULT 0,
    applies_to_products         BOOLEAN         NOT NULL DEFAULT FALSE,
    applies_to_subscriptions    BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active                   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_discount_value_positive CHECK (value > 0),
    CONSTRAINT chk_discount_dates          CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_discount_usage_limit    CHECK (usage_limit IS NULL OR usage_limit > 0),
    CONSTRAINT chk_discount_usage_count    CHECK (usage_count >= 0)
);

CREATE INDEX idx_discounts_created_by  ON discounts(created_by);
CREATE INDEX idx_discounts_is_active   ON discounts(is_active);
CREATE INDEX idx_discounts_dates       ON discounts(start_date, end_date);

COMMENT ON TABLE  discounts             IS 'Discount rules. Only admin can create (enforced at app + DB level via trigger)';
COMMENT ON COLUMN discounts.value       IS 'Rupee amount if fixed, percentage value if percentage type';
COMMENT ON COLUMN discounts.usage_limit IS 'NULL = unlimited usage';


-- ============================================================
-- 8. RECURRING PLANS
-- ============================================================

CREATE TABLE recurring_plans (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150)    NOT NULL,
    price           NUMERIC(12,2)   NOT NULL,
    billing_period  billing_period  NOT NULL,
    min_quantity    INTEGER         NOT NULL DEFAULT 1,
    start_date      DATE,
    end_date        DATE,
    auto_close      BOOLEAN         NOT NULL DEFAULT FALSE,
    closable        BOOLEAN         NOT NULL DEFAULT TRUE,
    pausable        BOOLEAN         NOT NULL DEFAULT FALSE,
    renewable       BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by      UUID            REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_plan_price_positive CHECK (price >= 0),
    CONSTRAINT chk_plan_dates          CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_plans_billing_period ON recurring_plans(billing_period);
CREATE INDEX idx_plans_is_active      ON recurring_plans(is_active);

COMMENT ON TABLE recurring_plans IS 'Billing rules for subscriptions. Managed by admin/internal users.';


-- ============================================================
-- 9. QUOTATION TEMPLATES
-- ============================================================

CREATE TABLE quotation_templates (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(150)    NOT NULL,
    validity_days       INTEGER         NOT NULL DEFAULT 30,
    recurring_plan_id   UUID            REFERENCES recurring_plans(id) ON DELETE SET NULL,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by          UUID            REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_validity_days_positive CHECK (validity_days > 0)
);

CREATE INDEX idx_templates_plan_id ON quotation_templates(recurring_plan_id);

COMMENT ON TABLE quotation_templates IS 'Predefined templates to speed up subscription creation';


-- ============================================================
-- 10. QUOTATION TEMPLATE LINES
-- ============================================================

CREATE TABLE quotation_template_lines (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id     UUID            NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity        INTEGER         NOT NULL DEFAULT 1,
    unit_price      NUMERIC(12,2)   NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_template_line_qty   CHECK (quantity > 0),
    CONSTRAINT chk_template_line_price CHECK (unit_price >= 0)
);

CREATE INDEX idx_template_lines_template_id ON quotation_template_lines(template_id);
CREATE INDEX idx_template_lines_product_id  ON quotation_template_lines(product_id);

COMMENT ON TABLE quotation_template_lines IS 'Pre-configured product lines inside a quotation template';


-- ============================================================
-- 11. SUBSCRIPTIONS
-- ============================================================

CREATE TABLE subscriptions (
    id                  UUID                NOT NULL DEFAULT uuid_generate_v4(),
    subscription_number VARCHAR(50)         NOT NULL,
    customer_id         UUID                NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    plan_id             UUID                REFERENCES recurring_plans(id) ON DELETE RESTRICT,
    template_id         UUID                REFERENCES quotation_templates(id) ON DELETE SET NULL,
    start_date          DATE                NOT NULL,
    expiration_date     DATE,
    payment_terms       VARCHAR(100),
    status              subscription_status NOT NULL DEFAULT 'draft',
    notes               TEXT,
    created_by          UUID                REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP           NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP           NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_subscriptions    PRIMARY KEY (id),
    CONSTRAINT uq_subscription_num UNIQUE (subscription_number),
    CONSTRAINT chk_sub_dates       CHECK (expiration_date IS NULL OR expiration_date >= start_date)
);

CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_plan_id     ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status      ON subscriptions(status);
CREATE INDEX idx_subscriptions_number      ON subscriptions(subscription_number);
CREATE INDEX idx_subscriptions_dates       ON subscriptions(start_date, expiration_date);

COMMENT ON TABLE  subscriptions                     IS 'Core subscription records with full lifecycle status';
COMMENT ON COLUMN subscriptions.subscription_number IS 'Auto-generated e.g. SUB-2024-00001';


-- ============================================================
-- 12. SUBSCRIPTION LINES
-- ============================================================

CREATE TABLE subscription_lines (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id     UUID            NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id          UUID            NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id          UUID            REFERENCES product_variants(id) ON DELETE SET NULL,
    discount_id         UUID            REFERENCES discounts(id) ON DELETE SET NULL,
    quantity            INTEGER         NOT NULL DEFAULT 1,
    unit_price          NUMERIC(12,2)   NOT NULL,
    tax_amount          NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    discount_amount     NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    total_amount        NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_sub_line_qty      CHECK (quantity > 0),
    CONSTRAINT chk_sub_line_price    CHECK (unit_price >= 0),
    CONSTRAINT chk_sub_line_tax      CHECK (tax_amount >= 0),
    CONSTRAINT chk_sub_line_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_sub_line_total    CHECK (total_amount >= 0)
);

CREATE INDEX idx_sub_lines_subscription_id ON subscription_lines(subscription_id);
CREATE INDEX idx_sub_lines_product_id      ON subscription_lines(product_id);
CREATE INDEX idx_sub_lines_discount_id     ON subscription_lines(discount_id);

COMMENT ON TABLE  subscription_lines              IS 'Individual product order lines per subscription';
COMMENT ON COLUMN subscription_lines.total_amount IS '(unit_price * quantity) + tax_amount - discount_amount';


-- ============================================================
-- 13. SUBSCRIPTION LINE TAXES (Junction)
-- ============================================================

CREATE TABLE subscription_line_taxes (
    id                      UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_line_id    UUID    NOT NULL REFERENCES subscription_lines(id) ON DELETE CASCADE,
    tax_id                  UUID    NOT NULL REFERENCES taxes(id) ON DELETE RESTRICT,

    UNIQUE(subscription_line_id, tax_id)
);

CREATE INDEX idx_sub_line_taxes_line_id ON subscription_line_taxes(subscription_line_id);
CREATE INDEX idx_sub_line_taxes_tax_id  ON subscription_line_taxes(tax_id);

COMMENT ON TABLE subscription_line_taxes IS 'Maps multiple taxes to a single subscription line';


-- ============================================================
-- 14. INVOICES
-- ============================================================

CREATE TABLE invoices (
    id                  UUID            NOT NULL DEFAULT uuid_generate_v4(),
    invoice_number      VARCHAR(50)     NOT NULL,
    subscription_id     UUID            NOT NULL REFERENCES subscriptions(id) ON DELETE RESTRICT,
    customer_id         UUID            NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status              invoice_status  NOT NULL DEFAULT 'draft',
    subtotal            NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    tax_total           NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    discount_total      NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    grand_total         NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    due_date            DATE,
    issued_date         DATE            NOT NULL DEFAULT CURRENT_DATE,
    sent_at             TIMESTAMP,
    confirmed_at        TIMESTAMP,
    cancelled_at        TIMESTAMP,
    notes               TEXT,
    created_by          UUID            REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_invoices          PRIMARY KEY (id),
    CONSTRAINT uq_invoice_number    UNIQUE (invoice_number),
    CONSTRAINT chk_invoice_subtotal    CHECK (subtotal >= 0),
    CONSTRAINT chk_invoice_tax         CHECK (tax_total >= 0),
    CONSTRAINT chk_invoice_discount    CHECK (discount_total >= 0),
    CONSTRAINT chk_invoice_grand_total CHECK (grand_total >= 0)
);

CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_customer_id     ON invoices(customer_id);
CREATE INDEX idx_invoices_status          ON invoices(status);
CREATE INDEX idx_invoices_due_date        ON invoices(due_date);
CREATE INDEX idx_invoices_number          ON invoices(invoice_number);

COMMENT ON TABLE  invoices             IS 'Invoices auto-generated from subscriptions';
COMMENT ON COLUMN invoices.grand_total IS 'subtotal + tax_total - discount_total';


-- ============================================================
-- 15. INVOICE LINES
-- ============================================================

CREATE TABLE invoice_lines (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id          UUID            NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id          UUID            NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    description         TEXT,
    quantity            INTEGER         NOT NULL DEFAULT 1,
    unit_price          NUMERIC(12,2)   NOT NULL,
    tax_amount          NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    discount_amount     NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    line_total          NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_inv_line_qty   CHECK (quantity > 0),
    CONSTRAINT chk_inv_line_price CHECK (unit_price >= 0),
    CONSTRAINT chk_inv_line_total CHECK (line_total >= 0)
);

CREATE INDEX idx_invoice_lines_invoice_id ON invoice_lines(invoice_id);
CREATE INDEX idx_invoice_lines_product_id ON invoice_lines(product_id);

COMMENT ON TABLE invoice_lines IS 'Individual product line items on an invoice';


-- ============================================================
-- 16. PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id              UUID            NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    customer_id             UUID            NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    amount                  NUMERIC(12,2)   NOT NULL,
    payment_method          payment_method  NOT NULL DEFAULT 'razorpay',
    payment_date            DATE            NOT NULL DEFAULT CURRENT_DATE,
    status                  payment_status  NOT NULL DEFAULT 'pending',

    -- Razorpay specific
    razorpay_order_id       VARCHAR(100),
    razorpay_payment_id     VARCHAR(100),
    razorpay_signature      TEXT,

    -- Bank transfer / other
    reference_number        VARCHAR(100),
    notes                   TEXT,

    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_invoice_id         ON payments(invoice_id);
CREATE INDEX idx_payments_customer_id        ON payments(customer_id);
CREATE INDEX idx_payments_status             ON payments(status);
CREATE INDEX idx_payments_razorpay_order_id  ON payments(razorpay_order_id);
CREATE INDEX idx_payments_payment_date       ON payments(payment_date);

COMMENT ON TABLE  payments                     IS 'Payment records for invoice settlement';
COMMENT ON COLUMN payments.razorpay_order_id   IS 'Order ID created via Razorpay API before checkout';
COMMENT ON COLUMN payments.razorpay_payment_id IS 'Payment ID returned after successful Razorpay payment';
COMMENT ON COLUMN payments.razorpay_signature  IS 'HMAC-SHA256 signature for server-side payment verification';


-- ============================================================
-- TRIGGERS — AUTO updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_customers
    BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_taxes
    BEFORE UPDATE ON taxes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_discounts
    BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_recurring_plans
    BEFORE UPDATE ON recurring_plans FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_quotation_templates
    BEFORE UPDATE ON quotation_templates FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_subscription_lines
    BEFORE UPDATE ON subscription_lines FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_invoices
    BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_payments
    BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================
-- TRIGGERS — AUTO-GENERATE HUMAN READABLE IDs
-- ============================================================

CREATE SEQUENCE subscription_number_seq START 1;
CREATE SEQUENCE invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_subscription_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_number IS NULL OR NEW.subscription_number = '' THEN
        NEW.subscription_number := 'SUB-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                                   LPAD(NEXTVAL('subscription_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscription_number
    BEFORE INSERT ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION generate_subscription_number();

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                              LPAD(NEXTVAL('invoice_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();


-- ============================================================
-- DB-LEVEL SAFETY TRIGGER 1:
-- Prevent non-admin from creating internal users
-- ============================================================

CREATE OR REPLACE FUNCTION check_internal_user_creator()
RETURNS TRIGGER AS $$
DECLARE
    creator_role user_role;
BEGIN
    IF NEW.role = 'internal' THEN
        IF NEW.created_by IS NULL THEN
            RAISE EXCEPTION 'Internal users must have a created_by admin user ID';
        END IF;
        SELECT role INTO creator_role FROM users WHERE id = NEW.created_by;
        IF creator_role IS NULL THEN
            RAISE EXCEPTION 'created_by user does not exist';
        END IF;
        IF creator_role != 'admin' THEN
            RAISE EXCEPTION 'Only admin users can create internal users. Creator role: %', creator_role;
        END IF;
    END IF;

    IF NEW.role = 'portal' AND NEW.created_by IS NOT NULL THEN
        RAISE EXCEPTION 'Portal/customer users cannot have a created_by. They self-register via signup.';
    END IF;

    IF NEW.role = 'admin' AND NEW.created_by IS NOT NULL THEN
        RAISE EXCEPTION 'Admin users are seeded manually and cannot have a created_by.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_internal_user_creator
    BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION check_internal_user_creator();


-- ============================================================
-- DB-LEVEL SAFETY TRIGGER 2:
-- Only admin can create discounts
-- ============================================================

CREATE OR REPLACE FUNCTION check_discount_creator()
RETURNS TRIGGER AS $$
DECLARE
    creator_role user_role;
BEGIN
    SELECT role INTO creator_role FROM users WHERE id = NEW.created_by;
    IF creator_role IS NULL THEN
        RAISE EXCEPTION 'created_by user does not exist';
    END IF;
    IF creator_role != 'admin' THEN
        RAISE EXCEPTION 'Only admin users can create discounts. Creator role: %', creator_role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_discount_creator
    BEFORE INSERT ON discounts
    FOR EACH ROW EXECUTE FUNCTION check_discount_creator();


-- ============================================================
-- REPORTING VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT
    s.id,
    s.subscription_number,
    s.status,
    s.start_date,
    s.expiration_date,
    c.company_name,
    u.name              AS customer_name,
    u.email             AS customer_email,
    rp.name             AS plan_name,
    rp.billing_period,
    rp.price            AS plan_price
FROM subscriptions s
JOIN customers c             ON c.id = s.customer_id
JOIN users u                 ON u.id = c.user_id
LEFT JOIN recurring_plans rp ON rp.id = s.plan_id
WHERE s.status = 'active';

CREATE OR REPLACE VIEW v_invoice_summary AS
SELECT
    i.id,
    i.invoice_number,
    i.status,
    i.grand_total,
    i.due_date,
    i.issued_date,
    u.name              AS customer_name,
    c.company_name,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'success'), 0)  AS amount_paid,
    i.grand_total - COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'success'), 0) AS amount_outstanding
FROM invoices i
JOIN customers c  ON c.id = i.customer_id
JOIN users u      ON u.id = c.user_id
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.status, i.grand_total, i.due_date, i.issued_date, u.name, c.company_name;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
    DATE_TRUNC('month', payment_date) AS month,
    COUNT(*)                           AS payment_count,
    SUM(amount)                        AS total_revenue
FROM payments
WHERE status = 'success'
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

CREATE OR REPLACE VIEW v_overdue_invoices AS
SELECT
    i.id,
    i.invoice_number,
    i.grand_total,
    i.due_date,
    CURRENT_DATE - i.due_date  AS days_overdue,
    u.name                     AS customer_name,
    u.email                    AS customer_email,
    c.company_name
FROM invoices i
JOIN customers c ON c.id = i.customer_id
JOIN users u     ON u.id = c.user_id
WHERE i.status = 'confirmed'
  AND i.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

CREATE OR REPLACE VIEW v_pending_invitations AS
SELECT
    ui.id,
    ui.email,
    u.name              AS invited_user_name,
    admin.name          AS invited_by_name,
    ui.status,
    ui.expires_at,
    ui.created_at,
    CASE WHEN ui.expires_at < NOW() THEN TRUE ELSE FALSE END AS is_expired
FROM user_invitations ui
JOIN users u      ON u.id = ui.user_id
JOIN users admin  ON admin.id = ui.invited_by
WHERE ui.status = 'pending'
ORDER BY ui.created_at DESC;


-- ============================================================
-- SEED DATA
-- ============================================================

-- ----------------------------------------------------------------
-- DEFAULT ADMIN USER
-- Created manually here. No signup API for admin.
--
-- Credentials:
--   Email    : admin@company.com
--   Password : Admin@1234
--
-- ⚠️  IMPORTANT: Replace password_hash below with a REAL bcrypt
--     hash generated by your backend before going to production.
--     Node.js: const hash = await bcrypt.hash('Admin@1234', 12)
-- ----------------------------------------------------------------

INSERT INTO users (
    name,
    email,
    password_hash,
    role,
    is_active,
    is_email_verified,
    created_by
) VALUES (
    'System Admin',
    'admin@company.com',
    '$2b$12$6aDcr8uc43b1Sk2wgXVlAOSsnSY1OipDXwmhO1nSwgRG9LVJ36R1y',
    'admin',
    TRUE,
    TRUE,
    NULL
);

-- Default GST tax rates (India)
INSERT INTO taxes (name, type, rate) VALUES
    ('GST 5%',  'percentage', 5.00),
    ('GST 12%', 'percentage', 12.00),
    ('GST 18%', 'percentage', 18.00),
    ('GST 28%', 'percentage', 28.00);


-- ============================================================
-- QUICK REFERENCE — USER CREATION FLOWS (for backend devs)
-- ============================================================
--
--  1. ADMIN
--  ────────
--  • Created ONLY via this SQL seed. No API endpoint.
--  • Login: POST /api/auth/login
--
--  2. INTERNAL USER (Employee)
--  ───────────────────────────
--  • Admin opens Admin Panel → Users → "Create Internal User"
--  • Admin fills: name + email → submits
--  • Backend:
--      a. Validates email is unique
--      b. INSERT into users (role='internal', password_hash=NULL,
--                            created_by=<admin_id>)
--      c. Generate invite_token = crypto.randomBytes(32).toString('hex')
--      d. Set invite_token_exp = NOW + 48h
--      e. INSERT into user_invitations
--      f. Send email to internal user:
--           Subject : "You have been invited to [Company] Portal"
--           Body    : "Click to set your password:"
--                     https://yourapp.com/set-password?token=<invite_token>
--  • Internal user clicks link → lands on /set-password page
--  • Backend (POST /api/auth/set-password):
--      a. Find user by invite_token
--      b. Check invite_token_exp > NOW()
--      c. Hash new password → save to password_hash
--      d. Clear invite_token, invite_token_exp
--      e. Set is_email_verified=TRUE, invite_accepted_at=NOW()
--      f. Update user_invitations status='accepted', accepted_at=NOW()
--      g. Return JWT → internal user is now logged in
--  • Admin can resend invite (generates new token, new row in user_invitations)
--  • Login after account setup: POST /api/auth/login (same endpoint)
--
--  3. CUSTOMER (Portal User)
--  ──────────────────────────
--  • Self-registers via: POST /api/auth/signup
--  • Backend:
--      a. Validate: unique email, strong password
--      b. INSERT into users (role='portal', created_by=NULL)
--      c. INSERT into customers (user_id=<new_user_id>)
--      d. Generate verify_token → set verify_token_exp = NOW + 24h
--      e. Send verification email:
--           Link: https://yourapp.com/verify-email?token=<verify_token>
--  • Customer clicks link → POST /api/auth/verify-email
--      a. Find user by verify_token
--      b. Check verify_token_exp > NOW()
--      c. Set is_email_verified=TRUE, clear verify_token
--  • Login: POST /api/auth/login
--
-- ============================================================
-- END OF SCHEMA
-- ============================================================
