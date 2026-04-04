const pool = require('../db');
const { razorpay, verifyPaymentSignature, verifyWebhookSignature } = require('../utils/razorpay');
const getPagination = (p,l) => { const pg=Math.max(1,parseInt(p)||1); const lm=Math.min(100,parseInt(l)||20); return {limit:lm,offset:(pg-1)*lm,page:pg}; };

const getPayments = async (req, res) => {
  try {
    const { status, method, subscription_id, page, limit } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);
    const conds=[]; const params=[]; let idx=1;
    if (status) { conds.push(`p.status=$${idx++}`); params.push(status); }
    if (method) { conds.push(`p.payment_method=$${idx++}`); params.push(method); }
    if (subscription_id) { conds.push(`i.subscription_id=$${idx++}`); params.push(subscription_id); }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';
    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM payments p ${where}`, params)).rows[0].count);
    params.push(lim,offset);
    const { rows } = await pool.query(
      `SELECT p.*, i.invoice_number, u.name as customer_name
       FROM payments p JOIN invoices i ON i.id=p.invoice_id JOIN customers c ON c.id=p.customer_id JOIN users u ON u.id=c.user_id
       ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params
    );
    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total/lim) } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch payments' }); }
};

const createOrder = async (req, res) => {
  try {
    const { invoice_id } = req.body;
    const { rows } = await pool.query('SELECT grand_total FROM invoices WHERE id=$1 AND status=$2', [invoice_id, 'confirmed']);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Confirmed invoice not found' });
    const amount = Math.round(parseFloat(rows[0].grand_total) * 100); // paise
    const order = await razorpay.orders.create({ amount, currency: 'INR', receipt: invoice_id });
    res.json({ success: true, data: { order_id: order.id, amount, currency: 'INR' } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to create payment order' }); }
};

const verifyPayment = async (req, res) => {
  try {
    const order_id = req.body.razorpay_order_id || req.body.order_id;
    const payment_id = req.body.razorpay_payment_id || req.body.payment_id;
    const signature = req.body.razorpay_signature || req.body.signature;
    const { invoice_id } = req.body;
    const isValid = verifyPaymentSignature(order_id, payment_id, signature);
    if (!isValid) return res.status(400).json({ success: false, error: 'Invalid payment signature' });

    const invRes = await pool.query('SELECT * FROM invoices WHERE id=$1', [invoice_id]);
    if (!invRes.rows[0]) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const inv = invRes.rows[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO payments (invoice_id,customer_id,amount,payment_method,status,razorpay_order_id,razorpay_payment_id,razorpay_signature)
         VALUES ($1,$2,$3,'razorpay','success',$4,$5,$6)`,
        [invoice_id, inv.customer_id, parseFloat(inv.grand_total), order_id, payment_id, signature]
      );
      await client.query("UPDATE invoices SET status='paid' WHERE id=$1", [invoice_id]);
      await client.query('COMMIT');
      res.json({ success: true, message: 'Payment verified and recorded' });
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Payment verification failed' }); }
};

const manualPayment = async (req, res) => {
  try {
    const { invoice_id, amount, payment_method, payment_date, reference_number, notes } = req.body;
    if (!invoice_id || !amount || !payment_method) return res.status(400).json({ success: false, error: 'invoice_id, amount, payment_method required' });
    const invRes = await pool.query('SELECT * FROM invoices WHERE id=$1', [invoice_id]);
    if (!invRes.rows[0]) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO payments (invoice_id,customer_id,amount,payment_method,payment_date,status,reference_number,notes)
         VALUES ($1,$2,$3,$4,$5,'success',$6,$7) RETURNING *`,
        [invoice_id, invRes.rows[0].customer_id, parseFloat(amount), payment_method, payment_date||new Date().toISOString().split('T')[0], reference_number||null, notes||null]
      );
      await client.query("UPDATE invoices SET status='paid' WHERE id=$1", [invoice_id]);
      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Payment recorded', data: rows[0] });
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to record payment' }); }
};

const webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = verifyWebhookSignature(req.body, signature);
    if (!isValid) return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    // Handle webhook events here
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: 'Webhook processing failed' }); }
};

module.exports = { getPayments, createOrder, verifyPayment, manualPayment, webhook };
