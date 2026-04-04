const pool = require('../db');
const getPagination = (p,l) => { const pg=Math.max(1,parseInt(p)||1); const lm=Math.min(100,parseInt(l)||20); return {limit:lm,offset:(pg-1)*lm,page:pg}; };

// GET /api/subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const { status, customer, plan, page, limit, search } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);
    const conds=[]; const params=[]; let idx=1;
    if (status) { conds.push(`s.status=$${idx++}`); params.push(status); }
    if (plan) { conds.push(`s.plan_id=$${idx++}`); params.push(plan); }
    if (search) { conds.push(`u.name ILIKE $${idx++}`); params.push(`%${search}%`); }
    const where = conds.length ? 'AND '+conds.join(' AND ') : '';
    const total = parseInt((await pool.query(
      `SELECT COUNT(*) FROM subscriptions s JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=c.user_id WHERE 1=1 ${where}`, params
    )).rows[0].count);
    params.push(lim, offset);
    const { rows } = await pool.query(
      `SELECT s.*, c.company_name, u.name as customer_name, u.email as customer_email, rp.name as plan_name, rp.price as plan_price, rp.billing_period
       FROM subscriptions s
       JOIN customers c ON c.id=s.customer_id
       JOIN users u ON u.id=c.user_id
       LEFT JOIN recurring_plans rp ON rp.id=s.plan_id
       WHERE 1=1 ${where}
       ORDER BY s.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params
    );
    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total/lim) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' }); }
};

// GET /api/subscriptions/my (portal)
const getMySubscriptions = async (req, res) => {
  try {
    const custRes = await pool.query('SELECT id FROM customers WHERE user_id=$1', [req.user.id]);
    if (!custRes.rows[0]) return res.status(404).json({ success: false, error: 'Customer profile not found' });
    const { rows } = await pool.query(
      `SELECT s.*, rp.name as plan_name, rp.price as plan_price, rp.billing_period
       FROM subscriptions s LEFT JOIN recurring_plans rp ON rp.id=s.plan_id
       WHERE s.customer_id=$1 ORDER BY s.created_at DESC`, [custRes.rows[0].id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' }); }
};

// POST /api/subscriptions
const createSubscription = async (req, res) => {
  try {
    const { customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, notes } = req.body;
    if (!customer_id || !start_date) return res.status(400).json({ success: false, error: 'customer_id and start_date are required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO subscriptions (customer_id, plan_id, template_id, start_date, expiration_date, payment_terms, notes, created_by, subscription_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'') RETURNING *`,
        [customer_id, plan_id||null, template_id||null, start_date, expiration_date||null, payment_terms||null, notes||null, req.user.id]
      );

      // If template, copy lines
      if (template_id) {
        const tLines = await client.query('SELECT * FROM quotation_template_lines WHERE template_id=$1', [template_id]);
        for (const line of tLines.rows) {
          await client.query(
            'INSERT INTO subscription_lines (subscription_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4)',
            [rows[0].id, line.product_id, line.quantity, line.unit_price]
          );
        }
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Subscription created', data: rows[0] });
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to create subscription' }); }
};

// GET /api/subscriptions/:id
const getSubscription = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, c.company_name, c.phone, c.address, c.city, c.state, c.country, c.postal_code, c.gstin,
              u.name as customer_name, u.email as customer_email,
              rp.name as plan_name, rp.price as plan_price, rp.billing_period
       FROM subscriptions s
       JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=c.user_id
       LEFT JOIN recurring_plans rp ON rp.id=s.plan_id
       WHERE s.id=$1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Subscription not found' });
    const lines = await pool.query(
      `SELECT sl.*, p.name as product_name, pv.attribute, pv.value as variant_value,
              json_agg(json_build_object('id',t.id,'name',t.name,'rate',t.rate)) FILTER (WHERE t.id IS NOT NULL) as taxes
       FROM subscription_lines sl
       JOIN products p ON p.id=sl.product_id
       LEFT JOIN product_variants pv ON pv.id=sl.variant_id
       LEFT JOIN subscription_line_taxes slt ON slt.subscription_line_id=sl.id
       LEFT JOIN taxes t ON t.id=slt.tax_id
       WHERE sl.subscription_id=$1 GROUP BY sl.id,p.name,pv.attribute,pv.value`, [req.params.id]
    );
    res.json({ success: true, data: { ...rows[0], lines: lines.rows } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to fetch subscription' }); }
};

// PUT /api/subscriptions/:id
const updateSubscription = async (req, res) => {
  try {
    const check = await pool.query('SELECT status FROM subscriptions WHERE id=$1', [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ success: false, error: 'Subscription not found' });
    if (['confirmed','active','closed'].includes(check.rows[0].status)) {
      return res.status(422).json({ success: false, error: 'This subscription is confirmed. No edits allowed.' });
    }
    const { plan_id, template_id, start_date, expiration_date, payment_terms, notes } = req.body;
    const { rows } = await pool.query(
      `UPDATE subscriptions SET plan_id=COALESCE($1,plan_id), template_id=COALESCE($2,template_id),
       start_date=COALESCE($3,start_date), expiration_date=COALESCE($4,expiration_date),
       payment_terms=COALESCE($5,payment_terms), notes=COALESCE($6,notes) WHERE id=$7 RETURNING *`,
      [plan_id, template_id, start_date, expiration_date, payment_terms, notes, req.params.id]
    );
    res.json({ success: true, message: 'Subscription updated', data: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to update subscription' }); }
};

// PATCH /api/subscriptions/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['quotation','confirmed','active','closed'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, error: 'Invalid status' });
    const { rows } = await pool.query('UPDATE subscriptions SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Subscription not found' });
    res.json({ success: true, message: 'Status updated', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update status' }); }
};

// POST /api/subscriptions/:id/lines
const addLine = async (req, res) => {
  try {
    const { product_id, variant_id, discount_id, quantity, unit_price, tax_ids, tax_amount, discount_amount } = req.body;
    if (!product_id || unit_price === undefined) return res.status(400).json({ success: false, error: 'product_id and unit_price are required' });
    const qty = parseInt(quantity) || 1;
    const up = parseFloat(unit_price);
    const ta = parseFloat(tax_amount) || 0;
    const da = parseFloat(discount_amount) || 0;
    const total = (up * qty) + ta - da;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO subscription_lines (subscription_id,product_id,variant_id,discount_id,quantity,unit_price,tax_amount,discount_amount,total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.params.id, product_id, variant_id||null, discount_id||null, qty, up, ta, da, total]
      );
      if (tax_ids && tax_ids.length > 0) {
        for (const tid of tax_ids) {
          await client.query('INSERT INTO subscription_line_taxes (subscription_line_id,tax_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, tid]);
        }
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, data: rows[0] });
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to add line' }); }
};

// PUT /api/subscriptions/:id/lines/:lid
const updateLine = async (req, res) => {
  try {
    const { quantity, unit_price, tax_amount, discount_amount, discount_id } = req.body;
    const qty = quantity ? parseInt(quantity) : null;
    const up = unit_price !== undefined ? parseFloat(unit_price) : null;
    const ta = tax_amount !== undefined ? parseFloat(tax_amount) : null;
    const da = discount_amount !== undefined ? parseFloat(discount_amount) : null;
    const { rows: current } = await pool.query('SELECT * FROM subscription_lines WHERE id=$1 AND subscription_id=$2', [req.params.lid, req.params.id]);
    if (!current[0]) return res.status(404).json({ success: false, error: 'Line not found' });
    const newQty = qty || current[0].quantity;
    const newUp = up !== null ? up : parseFloat(current[0].unit_price);
    const newTa = ta !== null ? ta : parseFloat(current[0].tax_amount);
    const newDa = da !== null ? da : parseFloat(current[0].discount_amount);
    const total = (newUp * newQty) + newTa - newDa;
    const { rows } = await pool.query(
      'UPDATE subscription_lines SET quantity=$1,unit_price=$2,tax_amount=$3,discount_amount=$4,total_amount=$5,discount_id=COALESCE($6,discount_id) WHERE id=$7 RETURNING *',
      [newQty, newUp, newTa, newDa, total, discount_id, req.params.lid]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update line' }); }
};

// DELETE /api/subscriptions/:id/lines/:lid
const deleteLine = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM subscription_lines WHERE id=$1 AND subscription_id=$2 RETURNING id', [req.params.lid, req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Line not found' });
    res.json({ success: true, message: 'Line deleted' });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to delete line' }); }
};

// POST /api/subscriptions/:id/invoice
const generateInvoice = async (req, res) => {
  try {
    const subRes = await pool.query(
      'SELECT * FROM subscriptions WHERE id=$1', [req.params.id]
    );
    if (!subRes.rows[0]) return res.status(404).json({ success: false, error: 'Subscription not found' });
    const sub = subRes.rows[0];
    const linesRes = await pool.query(
      'SELECT sl.*, p.name as product_name FROM subscription_lines sl JOIN products p ON p.id=sl.product_id WHERE sl.subscription_id=$1',
      [req.params.id]
    );
    const lines = linesRes.rows;
    const subtotal = lines.reduce((sum, l) => sum + parseFloat(l.unit_price) * parseInt(l.quantity), 0);
    const taxTotal = lines.reduce((sum, l) => sum + parseFloat(l.tax_amount), 0);
    const discTotal = lines.reduce((sum, l) => sum + parseFloat(l.discount_amount), 0);
    const grandTotal = subtotal + taxTotal - discTotal;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const invRes = await client.query(
        `INSERT INTO invoices (invoice_number,subscription_id,customer_id,subtotal,tax_total,discount_total,grand_total,created_by,issued_date)
         VALUES ('',$1,$2,$3,$4,$5,$6,$7,CURRENT_DATE) RETURNING *`,
        [sub.id, sub.customer_id, subtotal, taxTotal, discTotal, grandTotal, req.user.id]
      );
      const inv = invRes.rows[0];
      for (const line of lines) {
        await client.query(
          'INSERT INTO invoice_lines (invoice_id,product_id,description,quantity,unit_price,tax_amount,discount_amount,line_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [inv.id, line.product_id, line.product_name || null, line.quantity, line.unit_price, line.tax_amount, line.discount_amount, line.total_amount]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Invoice generated', data: inv });
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to generate invoice' }); }
};

const fromCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, error: 'Cart is empty' });

    // Get portal user's customer record
    const custRes = await pool.query('SELECT id FROM customers WHERE user_id = $1', [req.user.id]);
    if (!custRes.rows[0]) return res.status(400).json({ success: false, error: 'Customer profile not found. Please complete your profile.' });
    const customer_id = custRes.rows[0].id;

    const plan_id = items.find(i => i.plan_id)?.plan_id || null;
    const start_date = new Date().toISOString().split('T')[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO subscriptions (customer_id, plan_id, start_date, created_by, subscription_number)
         VALUES ($1, $2, $3, $4, '') RETURNING *`,
        [customer_id, plan_id, start_date, req.user.id]
      );
      const sub = rows[0];

      for (const item of items) {
        await client.query(
          'INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price) VALUES ($1,$2,$3,$4,$5)',
          [sub.id, item.product_id, item.variant_id || null, item.quantity || 1, item.unit_price]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, message: 'Order placed successfully', data: sub });
    } catch (err) { await client.query('ROLLBACK'); throw err; }
    finally { client.release(); }
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: 'Failed to place order' }); }
};

module.exports = { getSubscriptions, getMySubscriptions, createSubscription, getSubscription, updateSubscription, updateStatus, addLine, updateLine, deleteLine, generateInvoice, fromCart };
