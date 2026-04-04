const pool = require('../db');

const getDashboard = async (req, res) => {
  try {
    const [activeSubsRes, monthlyRevRes, overdueRes, pendingPayRes, expiringRes, totalUsersRes, totalCustomersRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='active'"),
      pool.query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='success' AND DATE_TRUNC('month',payment_date)=DATE_TRUNC('month',CURRENT_DATE)"),
      pool.query("SELECT COUNT(*) FROM invoices WHERE status='confirmed' AND due_date < CURRENT_DATE"),
      pool.query("SELECT COUNT(*) FROM payments WHERE status='pending'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status='active' AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'"),
      pool.query("SELECT COUNT(*) FROM users WHERE is_active=true"),
      pool.query("SELECT COUNT(*) FROM customers"),
    ]);
    res.json({
      success: true,
      data: {
        active_subscriptions: parseInt(activeSubsRes.rows[0].count),
        monthly_revenue: parseFloat(monthlyRevRes.rows[0].total),
        overdue_invoices: parseInt(overdueRes.rows[0].count),
        pending_payments: parseInt(pendingPayRes.rows[0].count),
        expiring_soon: parseInt(expiringRes.rows[0].count),
        total_users: parseInt(totalUsersRes.rows[0].count),
        total_customers: parseInt(totalCustomersRes.rows[0].count),
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' }); }
};

const getMonthlyRevenue = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_monthly_revenue LIMIT 12');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch revenue data' }); }
};

const getActiveSubscriptions = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_active_subscriptions');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch active subscriptions' }); }
};

const getInvoiceSummary = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_invoice_summary LIMIT 100');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch invoice summary' }); }
};

const getOverdueInvoices = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_overdue_invoices');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch overdue invoices' }); }
};

const getPendingInvitations = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM v_pending_invitations');
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch pending invitations' }); }
};

const getSubscriptionStatusBreakdown = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status ORDER BY count DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch subscription breakdown' }); }
};

const getRecentActivity = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT 'subscription' as type, s.id, s.subscription_number as ref,
               u.name as customer_name, s.created_at,
               'New subscription created' as description
        FROM subscriptions s
        JOIN customers c ON c.id = s.customer_id
        JOIN users u ON u.id = c.user_id
        UNION ALL
        SELECT 'payment' as type, p.id, i.invoice_number as ref,
               u.name as customer_name, p.created_at,
               'Payment received for invoice' as description
        FROM payments p
        JOIN invoices i ON i.id = p.invoice_id
        JOIN customers c ON c.id = p.customer_id
        JOIN users u ON u.id = c.user_id
        WHERE p.status = 'success'
        UNION ALL
        SELECT 'invoice' as type, i.id, i.invoice_number as ref,
               u.name as customer_name, i.created_at,
               'Invoice generated' as description
        FROM invoices i
        JOIN customers c ON c.id = i.customer_id
        JOIN users u ON u.id = c.user_id
      ) activity
      ORDER BY created_at DESC
      LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch recent activity' }); }
};

const getTopProducts = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.name, COALESCE(SUM(pay.amount), 0) as total_revenue, COUNT(DISTINCT il.invoice_id) as invoice_count
      FROM products p
      LEFT JOIN invoice_lines il ON il.product_id = p.id
      LEFT JOIN invoices i ON i.id = il.invoice_id
      LEFT JOIN payments pay ON pay.invoice_id = i.id AND pay.status = 'success'
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch top products' }); }
};

module.exports = { getDashboard, getMonthlyRevenue, getActiveSubscriptions, getInvoiceSummary, getOverdueInvoices, getPendingInvitations, getSubscriptionStatusBreakdown, getRecentActivity, getTopProducts };
