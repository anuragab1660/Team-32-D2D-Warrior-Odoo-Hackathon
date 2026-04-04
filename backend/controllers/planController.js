const pool = require('../db');
const getPagination = (page, limit) => { const p = Math.max(1, parseInt(page)||1); const l = Math.min(100, parseInt(limit)||20); return { limit: l, offset: (p-1)*l, page: p }; };

const getPlans = async (req, res) => {
  try {
    const { is_active, page, limit } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);
    const conditions = []; const params = []; let idx = 1;
    if (is_active !== undefined) { conditions.push(`is_active=$${idx++}`); params.push(is_active==='true'); }
    const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : '';
    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM recurring_plans ${where}`, params)).rows[0].count);
    params.push(lim, offset);
    const { rows } = await pool.query(`SELECT * FROM recurring_plans ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params);
    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total/lim) } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch plans' }); }
};

const createPlan = async (req, res) => {
  try {
    const { name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable } = req.body;
    if (!name || !billing_period || price === undefined) return res.status(400).json({ success: false, error: 'Name, billing_period, and price are required' });
    const { rows } = await pool.query(
      `INSERT INTO recurring_plans (name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, parseFloat(price), billing_period, min_quantity||1, start_date||null, end_date||null, auto_close||false, closable!==undefined?closable:true, pausable||false, renewable!==undefined?renewable:true, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Plan created', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to create plan' }); }
};

const getPlan = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM recurring_plans WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch plan' }); }
};

const updatePlan = async (req, res) => {
  try {
    const { name, price, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable } = req.body;
    const { rows } = await pool.query(
      `UPDATE recurring_plans SET name=COALESCE($1,name), price=COALESCE($2,price), billing_period=COALESCE($3,billing_period),
       min_quantity=COALESCE($4,min_quantity), start_date=COALESCE($5,start_date), end_date=COALESCE($6,end_date),
       auto_close=COALESCE($7,auto_close), closable=COALESCE($8,closable), pausable=COALESCE($9,pausable), renewable=COALESCE($10,renewable)
       WHERE id=$11 RETURNING *`,
      [name, price !== undefined ? parseFloat(price) : null, billing_period, min_quantity, start_date, end_date, auto_close, closable, pausable, renewable, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, message: 'Plan updated', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update plan' }); }
};

const togglePlan = async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE recurring_plans SET is_active=NOT is_active WHERE id=$1 RETURNING id,is_active', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to toggle plan' }); }
};

const deletePlan = async (req, res) => {
  try {
    const linked = await pool.query('SELECT COUNT(*) FROM subscriptions WHERE plan_id=$1', [req.params.id]);
    if (parseInt(linked.rows[0].count) > 0) return res.status(422).json({ success: false, error: 'Cannot delete — this plan has active subscriptions.' });
    const { rows } = await pool.query('DELETE FROM recurring_plans WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to delete plan' }); }
};

module.exports = { getPlans, createPlan, getPlan, updatePlan, togglePlan, deletePlan };
