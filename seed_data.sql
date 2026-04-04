-- ============================================================
-- SEED DATA FOR SUBSCRIPTION MANAGEMENT SYSTEM
-- Run after schema is created
-- ============================================================

DO $$
DECLARE
    admin_id UUID;
    tax_18_id UUID;

    -- User IDs (portal users for customer association)
    user_rahul_id UUID;
    user_priya_id UUID;
    user_arjun_id UUID;
    user_sneha_id UUID;
    user_vikram_id UUID;
    user_kavya_id UUID;
    user_rohit_id UUID;
    user_ananya_id UUID;
    user_suresh_id UUID;
    user_pooja_id UUID;

    -- Customer IDs
    customer_rahul_id UUID;
    customer_priya_id UUID;
    customer_arjun_id UUID;
    customer_sneha_id UUID;
    customer_vikram_id UUID;
    customer_kavya_id UUID;
    customer_rohit_id UUID;
    customer_ananya_id UUID;
    customer_suresh_id UUID;
    customer_pooja_id UUID;

    -- Product IDs
    prod_buffer_id UUID;
    prod_zoho_id UUID;
    prod_tally_id UUID;
    prod_slack_id UUID;
    prod_google_workspace_id UUID;
    prod_quickbooks_id UUID;
    prod_jira_id UUID;
    prod_mailchimp_id UUID;
    prod_aws_id UUID;
    prod_zoom_id UUID;

    -- Product Variant IDs (2-3 per product)
    var_buffer_starter_id UUID;
    var_buffer_pro_id UUID;
    var_zoho_basic_id UUID;
    var_zoho_premium_id UUID;
    var_tally_silver_id UUID;
    var_tally_gold_id UUID;
    var_slack_5users_id UUID;
    var_slack_10users_id UUID;
    var_google_basic_id UUID;
    var_google_business_id UUID;
    var_quickbooks_essential_id UUID;
    var_quickbooks_plus_id UUID;
    var_jira_10users_id UUID;
    var_jira_25users_id UUID;
    var_mailchimp_grow_id UUID;
    var_mailchimp_engage_id UUID;
    var_aws_100gb_id UUID;
    var_aws_500gb_id UUID;
    var_zoom_pro_id UUID;
    var_zoom_business_id UUID;

    -- Discount IDs
    discount_earlybird_id UUID;
    discount_festive_id UUID;
    discount_newyear_id UUID;
    discount_loyalty_id UUID;
    discount_q4_id UUID;

    -- Recurring Plan IDs
    plan_buffer_m_id UUID;
    plan_zoho_y_id UUID;
    plan_tally_m_id UUID;
    plan_slack_y_id UUID;
    plan_google_m_id UUID;
    plan_quickbooks_y_id UUID;
    plan_jira_m_id UUID;
    plan_mailchimp_y_id UUID;
    plan_aws_m_id UUID;
    plan_zoom_y_id UUID;

    -- Quotation Template IDs
    qt_buffer_id UUID;
    qt_zoho_id UUID;
    qt_tally_id UUID;
    qt_slack_id UUID;
    qt_google_id UUID;
    qt_quickbooks_id UUID;
    qt_jira_id UUID;
    qt_mailchimp_id UUID;
    qt_aws_id UUID;
    qt_zoom_id UUID;

    -- Quotation Template Line IDs
    qtl_buffer_1_id UUID;
    qtl_buffer_2_id UUID;
    qtl_zoho_1_id UUID;
    qtl_zoho_2_id UUID;
    qtl_tally_1_id UUID;
    qtl_tally_2_id UUID;
    qtl_slack_1_id UUID;
    qtl_slack_2_id UUID;
    qtl_google_1_id UUID;
    qtl_google_2_id UUID;
    qtl_quickbooks_1_id UUID;
    qtl_quickbooks_2_id UUID;
    qtl_jira_1_id UUID;
    qtl_jira_2_id UUID;
    qtl_mailchimp_1_id UUID;
    qtl_mailchimp_2_id UUID;
    qtl_aws_1_id UUID;
    qtl_aws_2_id UUID;
    qtl_zoom_1_id UUID;
    qtl_zoom_2_id UUID;

    -- Subscription IDs
    sub_rahul_id UUID;
    sub_priya_id UUID;
    sub_arjun_id UUID;
    sub_sneha_id UUID;
    sub_vikram_id UUID;
    sub_kavya_id UUID;
    sub_rohit_id UUID;
    sub_ananya_id UUID;
    sub_suresh_id UUID;
    sub_pooja_id UUID;

    -- Subscription Line IDs
    sl_rahul_1_id UUID;
    sl_rahul_2_id UUID;
    sl_priya_1_id UUID;
    sl_arjun_1_id UUID;
    sl_sneha_1_id UUID;
    sl_vikram_1_id UUID;
    sl_kavya_1_id UUID;
    sl_rohit_1_id UUID;
    sl_ananya_1_id UUID;
    sl_suresh_1_id UUID;
    sl_pooja_1_id UUID;

    -- Invoice IDs
    inv_rahul_id UUID;
    inv_priya_id UUID;
    inv_arjun_id UUID;
    inv_sneha_id UUID;
    inv_vikram_id UUID;
    inv_kavya_id UUID;
    inv_rohit_id UUID;
    inv_ananya_id UUID;
    inv_suresh_id UUID;
    inv_pooja_id UUID;

    -- Invoice Line IDs
    il_rahul_1_id UUID;
    il_rahul_2_id UUID;
    il_priya_1_id UUID;
    il_arjun_1_id UUID;
    il_sneha_1_id UUID;
    il_vikram_1_id UUID;
    il_kavya_1_id UUID;
    il_rohit_1_id UUID;
    il_ananya_1_id UUID;
    il_suresh_1_id UUID;
    il_pooja_1_id UUID;

    -- Payment IDs
    pay_rahul_1_id UUID;
    pay_priya_1_id UUID;
    pay_sneha_1_id UUID;
    pay_kavya_1_id UUID;
    pay_ananya_1_id UUID;
    pay_vikram_1_id UUID;
    pay_suresh_1_id UUID;
    pay_pooja_1_id UUID;

    pwd_hash TEXT := '$2b$12$6aDcr8uc43b1Sk2wgXVlAOSsnSY1OipDXwmhO1nSwgRG9LVJ36R1y';
    curr_date DATE := CURRENT_DATE;
    tax_rate NUMERIC := 0.18;
BEGIN
    -- Get admin_id dynamically
    SELECT id INTO admin_id FROM users WHERE email = 'admin@company.com';
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found. Please ensure admin@company.com exists.';
    END IF;

    -- Get GST 18% tax ID (already seeded in schema)
    SELECT id INTO tax_18_id FROM taxes WHERE name = 'GST 18%';
    IF tax_18_id IS NULL THEN
        RAISE EXCEPTION 'GST 18%% tax not found. Please ensure taxes are seeded.';
    END IF;

    RAISE NOTICE 'Using admin_id: % and tax_18_id: %', admin_id, tax_18_id;

    --------------------------------------------------------------------------
    -- 1. USERS (portal role only - 10 customers)
    --------------------------------------------------------------------------
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Rahul Sharma', 'rahul@techsolutions.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_rahul_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Priya Mehta', 'priya@digitaledge.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_priya_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Arjun Patel', 'arjun@cloudventures.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_arjun_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Sneha Joshi', 'sneha@innovatelab.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_sneha_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Vikram Singh', 'vikram@nexustech.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_vikram_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Kavya Nair', 'kavya@brightworks.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_kavya_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Rohit Gupta', 'rohit@smartsystems.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_rohit_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Ananya Das', 'ananya@pixelcraft.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_ananya_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Suresh Kumar', 'suresh@databridge.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_suresh_id;
    INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified)
    VALUES ('Pooja Verma', 'pooja@webfusion.in', pwd_hash, 'portal', TRUE, TRUE) RETURNING id INTO user_pooja_id;

    --------------------------------------------------------------------------
    -- 2. CUSTOMERS (one per portal user, Indian companies with GSTIN)
    --------------------------------------------------------------------------
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_rahul_id, 'Tech Solutions Pvt Ltd', '+919876543210', '101, Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400001', '27AABCD1234E1ZX') RETURNING id INTO customer_rahul_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_priya_id, 'Digital Edge Solutions', '+919876543211', '202, Cyber Hub, Sector 21', 'Delhi', 'Delhi', '110001', '07ABCDE5678F1ZX') RETURNING id INTO customer_priya_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_arjun_id, 'Cloud Ventures India', '+919876543212', '303, Tech Tower, SG Highway', 'Ahmedabad', 'Gujarat', '380001', '24FGHIJ9012G1ZX') RETURNING id INTO customer_arjun_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_sneha_id, 'Innovate Lab', '+919876543213', '404, Innovation Hub, Kharadi', 'Pune', 'Maharashtra', '411001', '27KLMNO3456H1ZX') RETURNING id INTO customer_sneha_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_vikram_id, 'Nexus Technologies', '+919876543214', '505, IT Corridor, Whitefield', 'Bangalore', 'Karnataka', '560001', '29PQRST7890I1ZX') RETURNING id INTO customer_vikram_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_kavya_id, 'Bright Works Agency', '+919876543215', '606, Digital Avenue, T Nagar', 'Chennai', 'Tamil Nadu', '600001', '33UVWXY2345J1ZX') RETURNING id INTO customer_kavya_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_rohit_id, 'Smart Systems Co', '+919876543216', '707, Software Park, HITEC City', 'Hyderabad', 'Telangana', '500001', '36ABCDA6789K1ZX') RETURNING id INTO customer_rohit_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_ananya_id, 'Pixel Craft Studio', '+919876543217', '808, Creative Zone, Salt Lake', 'Kolkata', 'West Bengal', '700001', '19BCDEF0123L1ZX') RETURNING id INTO customer_ananya_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_suresh_id, 'Data Bridge Analytics', '+919876543218', '909, Data Center, Vaishali Nagar', 'Jaipur', 'Rajasthan', '302001', '08CDEFG4567M1ZX') RETURNING id INTO customer_suresh_id;
    INSERT INTO customers (user_id, company_name, phone, address, city, state, postal_code, gstin)
    VALUES (user_pooja_id, 'Web Fusion Pvt Ltd', '+919876543219', '1010, Web Square, Ring Road', 'Surat', 'Gujarat', '395001', '24HIJKL8901N1ZX') RETURNING id INTO customer_pooja_id;

    --------------------------------------------------------------------------
    -- 3. PRODUCTS (10 products, created_by = admin_id)
    --------------------------------------------------------------------------
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Buffer - Social Media Scheduler', 'digital', 'Social media scheduling and management platform', 999.00, 600.00, admin_id) RETURNING id INTO prod_buffer_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Zoho CRM', 'digital', 'Customer Relationship Management software', 1499.00, 900.00, admin_id) RETURNING id INTO prod_zoho_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Tally ERP', 'digital', 'Business accounting and ERP software', 2999.00, 1800.00, admin_id) RETURNING id INTO prod_tally_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Slack - Team Messaging', 'digital', 'Team collaboration and messaging platform', 799.00, 500.00, admin_id) RETURNING id INTO prod_slack_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Google Workspace', 'service', 'Cloud-based productivity and collaboration suite', 1299.00, 800.00, admin_id) RETURNING id INTO prod_google_workspace_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('QuickBooks Accounting', 'digital', 'Small business accounting software', 1999.00, 1200.00, admin_id) RETURNING id INTO prod_quickbooks_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Jira - Project Tracker', 'digital', 'Issue tracking and project management tool', 899.00, 550.00, admin_id) RETURNING id INTO prod_jira_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Mailchimp - Email Marketing', 'digital', 'Email marketing and automation platform', 1199.00, 700.00, admin_id) RETURNING id INTO prod_mailchimp_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('AWS Cloud Hosting', 'service', 'Cloud computing and hosting services', 3999.00, 2500.00, admin_id) RETURNING id INTO prod_aws_id;
    INSERT INTO products (name, product_type, description, sales_price, cost_price, created_by)
    VALUES ('Zoom - Video Conferencing', 'service', 'Video conferencing and webinar platform', 699.00, 400.00, admin_id) RETURNING id INTO prod_zoom_id;

    --------------------------------------------------------------------------
    -- 4. PRODUCT VARIANTS (2 variants per product)
    --------------------------------------------------------------------------
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_buffer_id, 'Plan', 'Starter', 0.00) RETURNING id INTO var_buffer_starter_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_buffer_id, 'Plan', 'Pro', 300.00) RETURNING id INTO var_buffer_pro_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_zoho_id, 'Plan', 'Basic', 0.00) RETURNING id INTO var_zoho_basic_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_zoho_id, 'Plan', 'Premium', 500.00) RETURNING id INTO var_zoho_premium_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_tally_id, 'Plan', 'Silver', 0.00) RETURNING id INTO var_tally_silver_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_tally_id, 'Plan', 'Gold', 500.00) RETURNING id INTO var_tally_gold_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_slack_id, 'Users', '5 Users', 0.00) RETURNING id INTO var_slack_5users_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_slack_id, 'Users', '10 Users', 400.00) RETURNING id INTO var_slack_10users_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_google_workspace_id, 'Plan', 'Basic', 0.00) RETURNING id INTO var_google_basic_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_google_workspace_id, 'Plan', 'Business', 400.00) RETURNING id INTO var_google_business_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_quickbooks_id, 'Plan', 'Essential', 0.00) RETURNING id INTO var_quickbooks_essential_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_quickbooks_id, 'Plan', 'Plus', 800.00) RETURNING id INTO var_quickbooks_plus_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_jira_id, 'Users', '10 Users', 0.00) RETURNING id INTO var_jira_10users_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_jira_id, 'Users', '25 Users', 600.00) RETURNING id INTO var_jira_25users_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_mailchimp_id, 'Plan', 'Grow', 0.00) RETURNING id INTO var_mailchimp_grow_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_mailchimp_id, 'Plan', 'Engage', 400.00) RETURNING id INTO var_mailchimp_engage_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_aws_id, 'Storage', '100 GB', 0.00) RETURNING id INTO var_aws_100gb_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_aws_id, 'Storage', '500 GB', 800.00) RETURNING id INTO var_aws_500gb_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_zoom_id, 'Plan', 'Pro', 0.00) RETURNING id INTO var_zoom_pro_id;
    INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES (prod_zoom_id, 'Plan', 'Business', 400.00) RETURNING id INTO var_zoom_business_id;

    --------------------------------------------------------------------------
    -- 5. TAXES (SKIP - already seeded in schema)
    --------------------------------------------------------------------------

    --------------------------------------------------------------------------
    -- 6. DISCOUNTS (5 discounts, created_by = admin_id)
    --------------------------------------------------------------------------
    INSERT INTO discounts (name, created_by, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, is_active)
    VALUES ('EARLYBIRD20', admin_id, 'percentage', 20.00, 0.00, 1, curr_date - 30, curr_date + 30, 100, TRUE) RETURNING id INTO discount_earlybird_id;
    INSERT INTO discounts (name, created_by, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, is_active)
    VALUES ('FESTIVESALE15', admin_id, 'percentage', 15.00, 0.00, 1, curr_date - 15, curr_date + 15, 200, TRUE) RETURNING id INTO discount_festive_id;
    INSERT INTO discounts (name, created_by, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, is_active)
    VALUES ('NEWYEAR100', admin_id, 'fixed', 100.00, 500.00, 1, curr_date - 10, curr_date + 20, 50, TRUE) RETURNING id INTO discount_newyear_id;
    INSERT INTO discounts (name, created_by, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, is_active)
    VALUES ('LOYALTY5', admin_id, 'percentage', 5.00, 0.00, 1, curr_date - 60, curr_date + 90, NULL, TRUE) RETURNING id INTO discount_loyalty_id;
    INSERT INTO discounts (name, created_by, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, is_active)
    VALUES ('Q4PROMO12', admin_id, 'percentage', 12.00, 0.00, 1, curr_date - 7, curr_date + 7, 75, TRUE) RETURNING id INTO discount_q4_id;

    --------------------------------------------------------------------------
    -- 7. RECURRING PLANS (10 plans, created_by = admin_id)
    --------------------------------------------------------------------------
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Buffer Starter Monthly', 999.00, 'monthly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_buffer_m_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Zoho CRM Premium Yearly', 14999.00, 'yearly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_zoho_y_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Tally ERP Gold Monthly', 2999.00, 'monthly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_tally_m_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Slack 10 Users Yearly', 7999.00, 'yearly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_slack_y_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Google Workspace Business Monthly', 1299.00, 'monthly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_google_m_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('QuickBooks Plus Yearly', 19999.00, 'yearly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_quickbooks_y_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Jira 25 Users Monthly', 8999.00, 'monthly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_jira_m_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Mailchimp Engage Yearly', 11999.00, 'yearly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_mailchimp_y_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('AWS 500GB Monthly', 3999.00, 'monthly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_aws_m_id;
    INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, is_active, created_by)
    VALUES ('Zoom Business Yearly', 6999.00, 'yearly', 1, curr_date, curr_date + 365, FALSE, TRUE, FALSE, TRUE, TRUE, admin_id) RETURNING id INTO plan_zoom_y_id;

    --------------------------------------------------------------------------
    -- 8. QUOTATION TEMPLATES (10 templates, created_by = admin_id)
    --------------------------------------------------------------------------
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Buffer Basic Offer', 30, plan_buffer_m_id, TRUE, admin_id) RETURNING id INTO qt_buffer_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Zoho CRM Corporate Deal', 30, plan_zoho_y_id, TRUE, admin_id) RETURNING id INTO qt_zoho_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Tally ERP Pro Package', 30, plan_tally_m_id, TRUE, admin_id) RETURNING id INTO qt_tally_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Slack Team Collaboration', 30, plan_slack_y_id, TRUE, admin_id) RETURNING id INTO qt_slack_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Google Workspace Business', 30, plan_google_m_id, TRUE, admin_id) RETURNING id INTO qt_google_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('QuickBooks Enterprise', 30, plan_quickbooks_y_id, TRUE, admin_id) RETURNING id INTO qt_quickbooks_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Jira Dev Team Plan', 30, plan_jira_m_id, TRUE, admin_id) RETURNING id INTO qt_jira_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Mailchimp Marketing Suite', 30, plan_mailchimp_y_id, TRUE, admin_id) RETURNING id INTO qt_mailchimp_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('AWS Startup Hosting', 30, plan_aws_m_id, TRUE, admin_id) RETURNING id INTO qt_aws_id;
    INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, is_active, created_by)
    VALUES ('Zoom Enterprise Comm', 30, plan_zoom_y_id, TRUE, admin_id) RETURNING id INTO qt_zoom_id;

    --------------------------------------------------------------------------
    -- 9. QUOTATION TEMPLATE LINES (2 lines per template)
    --------------------------------------------------------------------------
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_buffer_id, prod_buffer_id, 1, 999.00) RETURNING id INTO qtl_buffer_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_buffer_id, prod_buffer_id, 1, 100.00) RETURNING id INTO qtl_buffer_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_zoho_id, prod_zoho_id, 1, 14999.00) RETURNING id INTO qtl_zoho_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_zoho_id, prod_zoho_id, 1, 500.00) RETURNING id INTO qtl_zoho_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_tally_id, prod_tally_id, 1, 2999.00) RETURNING id INTO qtl_tally_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_tally_id, prod_tally_id, 1, 150.00) RETURNING id INTO qtl_tally_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_slack_id, prod_slack_id, 1, 7999.00) RETURNING id INTO qtl_slack_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_slack_id, prod_slack_id, 1, 200.00) RETURNING id INTO qtl_slack_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_google_id, prod_google_workspace_id, 1, 1299.00) RETURNING id INTO qtl_google_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_google_id, prod_google_workspace_id, 1, 50.00) RETURNING id INTO qtl_google_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_quickbooks_id, prod_quickbooks_id, 1, 19999.00) RETURNING id INTO qtl_quickbooks_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_quickbooks_id, prod_quickbooks_id, 1, 750.00) RETURNING id INTO qtl_quickbooks_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_jira_id, prod_jira_id, 1, 8999.00) RETURNING id INTO qtl_jira_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_jira_id, prod_jira_id, 1, 300.00) RETURNING id INTO qtl_jira_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_mailchimp_id, prod_mailchimp_id, 1, 11999.00) RETURNING id INTO qtl_mailchimp_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_mailchimp_id, prod_mailchimp_id, 1, 400.00) RETURNING id INTO qtl_mailchimp_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_aws_id, prod_aws_id, 1, 3999.00) RETURNING id INTO qtl_aws_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_aws_id, prod_aws_id, 1, 600.00) RETURNING id INTO qtl_aws_2_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_zoom_id, prod_zoom_id, 1, 6999.00) RETURNING id INTO qtl_zoom_1_id;
    INSERT INTO quotation_template_lines (template_id, product_id, quantity, unit_price) VALUES (qt_zoom_id, prod_zoom_id, 1, 250.00) RETURNING id INTO qtl_zoom_2_id;

    --------------------------------------------------------------------------
    -- 10. SUBSCRIPTIONS (10 subscriptions, mix of statuses)
    --------------------------------------------------------------------------
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_rahul_id, plan_buffer_m_id, qt_buffer_id, curr_date - 15, curr_date + 15, 'Net 15', 'active', 'Monthly Buffer subscription', admin_id) RETURNING id INTO sub_rahul_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_priya_id, plan_zoho_y_id, qt_zoho_id, curr_date - 60, curr_date + 300, 'Net 30', 'confirmed', 'Annual Zoho CRM license', admin_id) RETURNING id INTO sub_priya_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_arjun_id, plan_tally_m_id, qt_tally_id, curr_date - 90, curr_date - 30, 'Net 15', 'closed', 'Tally ERP - cancelled', admin_id) RETURNING id INTO sub_arjun_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_sneha_id, plan_slack_y_id, qt_slack_id, curr_date - 5, curr_date + 360, 'Net 30', 'active', 'Slack workspace', admin_id) RETURNING id INTO sub_sneha_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_vikram_id, plan_google_m_id, qt_google_id, curr_date + 1, curr_date + 31, 'Net 15', 'quotation', 'Google Workspace quote', admin_id) RETURNING id INTO sub_vikram_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_kavya_id, plan_quickbooks_y_id, qt_quickbooks_id, curr_date - 20, curr_date + 345, 'Net 30', 'active', 'QuickBooks annual', admin_id) RETURNING id INTO sub_kavya_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_rohit_id, plan_jira_m_id, qt_jira_id, curr_date, curr_date + 30, 'Net 15', 'draft', 'Jira project tracking', admin_id) RETURNING id INTO sub_rohit_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_ananya_id, plan_mailchimp_y_id, qt_mailchimp_id, curr_date - 10, curr_date + 355, 'Net 30', 'active', 'Email marketing', admin_id) RETURNING id INTO sub_ananya_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_suresh_id, plan_aws_m_id, qt_aws_id, curr_date - 2, curr_date + 28, 'Net 15', 'active', 'AWS hosting', admin_id) RETURNING id INTO sub_suresh_id;
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, status, notes, created_by)
    VALUES ('', customer_pooja_id, plan_zoom_y_id, qt_zoom_id, curr_date - 45, curr_date + 320, 'Net 30', 'confirmed', 'Zoom video conferencing', admin_id) RETURNING id INTO sub_pooja_id;

    --------------------------------------------------------------------------
    -- 11. SUBSCRIPTION LINES
    --------------------------------------------------------------------------
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_rahul_id, prod_buffer_id, var_buffer_starter_id, 1, 999.00, 179.82, 0.00, 1178.82) RETURNING id INTO sl_rahul_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_rahul_id, prod_buffer_id, NULL, 1, 100.00, 18.00, 0.00, 118.00) RETURNING id INTO sl_rahul_2_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_priya_id, prod_zoho_id, var_zoho_premium_id, 1, 14999.00, 2699.82, 0.00, 17698.82) RETURNING id INTO sl_priya_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_arjun_id, prod_tally_id, var_tally_gold_id, 1, 2999.00, 539.82, 0.00, 3538.82) RETURNING id INTO sl_arjun_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_sneha_id, prod_slack_id, var_slack_10users_id, 1, 7999.00, 1439.82, 0.00, 9438.82) RETURNING id INTO sl_sneha_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_vikram_id, prod_google_workspace_id, var_google_business_id, 1, 1299.00, 233.82, 0.00, 1532.82) RETURNING id INTO sl_vikram_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_kavya_id, prod_quickbooks_id, var_quickbooks_plus_id, 1, 19999.00, 3599.82, 0.00, 23598.82) RETURNING id INTO sl_kavya_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_rohit_id, prod_jira_id, var_jira_25users_id, 1, 8999.00, 1619.82, 0.00, 10618.82) RETURNING id INTO sl_rohit_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_ananya_id, prod_mailchimp_id, var_mailchimp_engage_id, 1, 11999.00, 2159.82, 0.00, 14158.82) RETURNING id INTO sl_ananya_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_suresh_id, prod_aws_id, var_aws_500gb_id, 1, 3999.00, 719.82, 0.00, 4718.82) RETURNING id INTO sl_suresh_1_id;
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_amount, discount_amount, total_amount)
    VALUES (sub_pooja_id, prod_zoom_id, var_zoom_business_id, 1, 6999.00, 1259.82, 0.00, 8258.82) RETURNING id INTO sl_pooja_1_id;

    --------------------------------------------------------------------------
    -- 12. SUBSCRIPTION LINE TAXES
    --------------------------------------------------------------------------
    INSERT INTO subscription_line_taxes (subscription_line_id, tax_id) VALUES
        (sl_rahul_1_id, tax_18_id),
        (sl_rahul_2_id, tax_18_id),
        (sl_priya_1_id, tax_18_id),
        (sl_arjun_1_id, tax_18_id),
        (sl_sneha_1_id, tax_18_id),
        (sl_vikram_1_id, tax_18_id),
        (sl_kavya_1_id, tax_18_id),
        (sl_rohit_1_id, tax_18_id),
        (sl_ananya_1_id, tax_18_id),
        (sl_suresh_1_id, tax_18_id),
        (sl_pooja_1_id, tax_18_id);

    --------------------------------------------------------------------------
    -- 13. INVOICES (10 invoices, mix of statuses)
    --------------------------------------------------------------------------
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_rahul_id, customer_rahul_id, 'paid', 1099.00, 197.82, 0.00, 1296.82, curr_date - 5, curr_date - 10, 'Buffer subscription invoice', admin_id) RETURNING id INTO inv_rahul_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_priya_id, customer_priya_id, 'confirmed', 14999.00, 2699.82, 0.00, 17698.82, curr_date - 20, curr_date - 50, 'Zoho CRM annual invoice', admin_id) RETURNING id INTO inv_priya_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_arjun_id, customer_arjun_id, 'cancelled', 2999.00, 539.82, 0.00, 3538.82, curr_date - 50, curr_date - 80, 'Tally ERP - cancelled', admin_id) RETURNING id INTO inv_arjun_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_sneha_id, customer_sneha_id, 'paid', 7999.00, 1439.82, 0.00, 9438.82, curr_date + 7, curr_date - 3, 'Slack yearly invoice', admin_id) RETURNING id INTO inv_sneha_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_vikram_id, customer_vikram_id, 'draft', 1299.00, 233.82, 0.00, 1532.82, curr_date + 15, curr_date, 'Google Workspace - draft', admin_id) RETURNING id INTO inv_vikram_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_kavya_id, customer_kavya_id, 'confirmed', 19999.00, 3599.82, 0.00, 23598.82, curr_date - 5, curr_date - 15, 'QuickBooks annual invoice', admin_id) RETURNING id INTO inv_kavya_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_rohit_id, customer_rohit_id, 'draft', 8999.00, 1619.82, 0.00, 10618.82, curr_date + 10, curr_date, 'Jira monthly - draft', admin_id) RETURNING id INTO inv_rohit_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_ananya_id, customer_ananya_id, 'paid', 11999.00, 2159.82, 0.00, 14158.82, curr_date - 2, curr_date - 7, 'Mailchimp yearly invoice', admin_id) RETURNING id INTO inv_ananya_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_suresh_id, customer_suresh_id, 'confirmed', 3999.00, 719.82, 0.00, 4718.82, curr_date + 9, curr_date - 1, 'AWS monthly invoice', admin_id) RETURNING id INTO inv_suresh_id;
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, status, subtotal, tax_total, discount_total, grand_total, due_date, issued_date, notes, created_by)
    VALUES ('', sub_pooja_id, customer_pooja_id, 'draft', 6999.00, 1259.82, 0.00, 8258.82, curr_date + 20, curr_date, 'Zoom yearly - draft', admin_id) RETURNING id INTO inv_pooja_id;

    --------------------------------------------------------------------------
    -- 14. INVOICE LINES
    --------------------------------------------------------------------------
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_rahul_id, prod_buffer_id, 'Buffer Starter Plan', 1, 999.00, 179.82, 0.00, 1178.82) RETURNING id INTO il_rahul_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_rahul_id, prod_buffer_id, 'Onboarding Support', 1, 100.00, 18.00, 0.00, 118.00) RETURNING id INTO il_rahul_2_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_priya_id, prod_zoho_id, 'Zoho CRM Premium (Yearly)', 1, 14999.00, 2699.82, 0.00, 17698.82) RETURNING id INTO il_priya_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_arjun_id, prod_tally_id, 'Tally ERP Gold (Monthly)', 1, 2999.00, 539.82, 0.00, 3538.82) RETURNING id INTO il_arjun_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_sneha_id, prod_slack_id, 'Slack 10 Users (Yearly)', 1, 7999.00, 1439.82, 0.00, 9438.82) RETURNING id INTO il_sneha_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_vikram_id, prod_google_workspace_id, 'Google Workspace Business', 1, 1299.00, 233.82, 0.00, 1532.82) RETURNING id INTO il_vikram_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_kavya_id, prod_quickbooks_id, 'QuickBooks Plus (Yearly)', 1, 19999.00, 3599.82, 0.00, 23598.82) RETURNING id INTO il_kavya_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_rohit_id, prod_jira_id, 'Jira 25 Users (Monthly)', 1, 8999.00, 1619.82, 0.00, 10618.82) RETURNING id INTO il_rohit_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_ananya_id, prod_mailchimp_id, 'Mailchimp Engage (Yearly)', 1, 11999.00, 2159.82, 0.00, 14158.82) RETURNING id INTO il_ananya_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_suresh_id, prod_aws_id, 'AWS 500GB (Monthly)', 1, 3999.00, 719.82, 0.00, 4718.82) RETURNING id INTO il_suresh_1_id;
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, tax_amount, discount_amount, line_total)
    VALUES (inv_pooja_id, prod_zoom_id, 'Zoom Business (Yearly)', 1, 6999.00, 1259.82, 0.00, 8258.82) RETURNING id INTO il_pooja_1_id;

    --------------------------------------------------------------------------
    -- 15. PAYMENTS (8 payments, mix of methods and statuses)
    --------------------------------------------------------------------------
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_rahul_id, customer_rahul_id, 1296.82, 'razorpay', curr_date - 6, 'success', 'order_rahul_abc123', 'pay_rahul_xyz789', NULL, 'Paid via Razorpay') RETURNING id INTO pay_rahul_1_id;
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_priya_id, customer_priya_id, 17698.82, 'bank_transfer', curr_date - 40, 'pending', NULL, NULL, 'BT-PRIYA-456', 'Bank transfer initiated') RETURNING id INTO pay_priya_1_id;
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_sneha_id, customer_sneha_id, 9438.82, 'razorpay', curr_date - 1, 'success', 'order_sneha_def456', 'pay_sneha_ghi123', NULL, 'Paid via Razorpay') RETURNING id INTO pay_sneha_1_id;
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_kavya_id, customer_kavya_id, 23598.82, 'bank_transfer', curr_date - 10, 'success', NULL, NULL, 'BT-KAVYA-789', 'Bank transfer confirmed') RETURNING id INTO pay_kavya_1_id;
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_ananya_id, customer_ananya_id, 14158.82, 'razorpay', curr_date - 3, 'success', 'order_ananya_jkl789', 'pay_ananya_mno123', NULL, 'Paid via Razorpay') RETURNING id INTO pay_ananya_1_id;
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_vikram_id, customer_vikram_id, 1532.82, 'cash', curr_date, 'pending', NULL, NULL, NULL, 'Cash payment pending') RETURNING id INTO pay_vikram_1_id;
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_suresh_id, customer_suresh_id, 4718.82, 'razorpay', curr_date, 'pending', 'order_suresh_pqr123', NULL, NULL, 'Payment initiated') RETURNING id INTO pay_suresh_1_id;
    INSERT INTO payments (invoice_id, customer_id, amount, payment_method, payment_date, status, razorpay_order_id, razorpay_payment_id, reference_number, notes)
    VALUES (inv_pooja_id, customer_pooja_id, 8258.82, 'bank_transfer', curr_date - 1, 'pending', NULL, NULL, 'BT-POOJA-321', 'Transfer pending verification') RETURNING id INTO pay_pooja_1_id;

    RAISE NOTICE 'Seed data inserted successfully.';
END $$;
