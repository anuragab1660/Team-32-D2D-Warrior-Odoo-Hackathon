const pool = require('../db');
const getPagination = (p,l) => { const pg=Math.max(1,parseInt(p)||1); const lm=Math.min(100,parseInt(l)||20); return {limit:lm,offset:(pg-1)*lm,page:pg}; };

const getInvoices = async (req, res) => {
  try {
    const { status, customer, page, limit } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);
    const conds=[]; const params=[]; let idx=1;
    if (status) { conds.push(`i.status=$${idx++}`); params.push(status); }
    if (customer) { conds.push(`u.name ILIKE $${idx++}`); params.push(`%${customer}%`); }
    const where = conds.length ? 'AND '+conds.join(' AND ') : '';
    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM invoices i JOIN customers c ON c.id=i.customer_id JOIN users u ON u.id=c.user_id WHERE 1=1 ${where}`, params)).rows[0].count);
    params.push(lim,offset);
    const { rows } = await pool.query(
      `SELECT i.*, u.name as customer_name, u.email as customer_email, c.company_name
       FROM invoices i JOIN customers c ON c.id=i.customer_id JOIN users u ON u.id=c.user_id
       WHERE 1=1 ${where} ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params
    );
    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total/lim) } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch invoices' }); }
};

const getInvoice = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, u.name as customer_name, u.email as customer_email, c.company_name, c.phone, c.address, c.city, c.state, c.postal_code, c.gstin
       FROM invoices i JOIN customers c ON c.id=i.customer_id JOIN users u ON u.id=c.user_id WHERE i.id=$1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const lines = await pool.query(
      'SELECT il.*, p.name as product_name FROM invoice_lines il JOIN products p ON p.id=il.product_id WHERE il.invoice_id=$1', [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], lines: lines.rows } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch invoice' }); }
};

const confirmInvoice = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE invoices SET status='confirmed', confirmed_at=NOW() WHERE id=$1 AND status='draft' RETURNING *", [req.params.id]
    );
    if (!rows[0]) return res.status(422).json({ success: false, error: 'Invoice not found or not in draft status' });
    res.json({ success: true, message: 'Invoice confirmed', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to confirm invoice' }); }
};

const cancelInvoice = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE invoices SET status='cancelled', cancelled_at=NOW() WHERE id=$1 AND status IN ('draft','confirmed') RETURNING *", [req.params.id]
    );
    if (!rows[0]) return res.status(422).json({ success: false, error: 'Invoice cannot be cancelled' });
    res.json({ success: true, message: 'Invoice cancelled', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to cancel invoice' }); }
};

const getPaymentStatus = async (req, res) => {
  try {
    const invRes = await pool.query('SELECT grand_total FROM invoices WHERE id=$1', [req.params.id]);
    if (!invRes.rows[0]) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const payRes = await pool.query("SELECT COALESCE(SUM(amount),0) as amount_paid FROM payments WHERE invoice_id=$1 AND status='success'", [req.params.id]);
    const amountPaid = parseFloat(payRes.rows[0].amount_paid);
    const grandTotal = parseFloat(invRes.rows[0].grand_total);
    res.json({ success: true, data: { amount_paid: amountPaid, amount_outstanding: grandTotal - amountPaid } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to get payment status' }); }
};

const getCustomerInvoices = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM invoices WHERE customer_id=$1 ORDER BY created_at DESC', [req.params.cid]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch invoices' }); }
};

module.exports = { getInvoices, getInvoice, confirmInvoice, cancelInvoice, getPaymentStatus, getCustomerInvoices };
