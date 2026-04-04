const pool = require('../db');
const getPagination = (page, limit) => { const p = Math.max(1, parseInt(page)||1); const l = Math.min(100, parseInt(limit)||20); return { limit: l, offset: (p-1)*l, page: p }; };

const getDiscounts = async (req, res) => {
  try {
    const { is_active, page, limit } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);
    const conditions = []; const params = []; let idx = 1;
    if (is_active !== undefined) { conditions.push(`is_active = $${idx++}`); params.push(is_active === 'true'); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM discounts ${where}`, params)).rows[0].count);
    params.push(lim, offset);
    const { rows } = await pool.query(`SELECT d.*, u.name as created_by_name FROM discounts d LEFT JOIN users u ON u.id=d.created_by ${where} ORDER BY d.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params);
    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total/lim) } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch discounts' }); }
};

const createDiscount = async (req, res) => {
  try {
    const { name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, applies_to_products, applies_to_subscriptions } = req.body;
    if (!name || !type || value === undefined) return res.status(400).json({ success: false, error: 'Name, type, and value are required' });
    const { rows } = await pool.query(
      `INSERT INTO discounts (name, created_by, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, applies_to_products, applies_to_subscriptions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, req.user.id, type, parseFloat(value), min_purchase||0, min_quantity||1, start_date||null, end_date||null, usage_limit||null, applies_to_products||false, applies_to_subscriptions||false]
    );
    res.status(201).json({ success: true, message: 'Discount created', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to create discount' }); }
};

const getDiscount = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM discounts WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Discount not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch discount' }); }
};

const updateDiscount = async (req, res) => {
  try {
    const { name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, applies_to_products, applies_to_subscriptions } = req.body;
    const { rows } = await pool.query(
      `UPDATE discounts SET name=COALESCE($1,name), type=COALESCE($2,type), value=COALESCE($3,value),
       min_purchase=COALESCE($4,min_purchase), min_quantity=COALESCE($5,min_quantity),
       start_date=COALESCE($6,start_date), end_date=COALESCE($7,end_date),
       usage_limit=COALESCE($8,usage_limit), applies_to_products=COALESCE($9,applies_to_products),
       applies_to_subscriptions=COALESCE($10,applies_to_subscriptions) WHERE id=$11 RETURNING *`,
      [name, type, value !== undefined ? parseFloat(value) : null, min_purchase, min_quantity, start_date, end_date, usage_limit, applies_to_products, applies_to_subscriptions, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Discount not found' });
    res.json({ success: true, message: 'Discount updated', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update discount' }); }
};

const toggleDiscount = async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE discounts SET is_active=NOT is_active WHERE id=$1 RETURNING id,is_active', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Discount not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to toggle discount' }); }
};

const deleteDiscount = async (req, res) => {
  try {
    const { rows: d } = await pool.query('SELECT usage_count FROM discounts WHERE id=$1', [req.params.id]);
    if (!d[0]) return res.status(404).json({ success: false, error: 'Discount not found' });
    if (d[0].usage_count > 0) return res.status(422).json({ success: false, error: 'Cannot delete — this discount has been applied.' });
    await pool.query('DELETE FROM discounts WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Discount deleted' });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to delete discount' }); }
};

module.exports = { getDiscounts, createDiscount, getDiscount, updateDiscount, toggleDiscount, deleteDiscount };
