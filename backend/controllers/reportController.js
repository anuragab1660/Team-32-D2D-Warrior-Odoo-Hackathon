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

module.exports = { getDashboard, getMonthlyRevenue, getActiveSubscriptions, getInvoiceSummary, getOverdueInvoices, getPendingInvitations };
