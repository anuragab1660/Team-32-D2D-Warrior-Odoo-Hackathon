const pool = require('../db');
const getPagination = (page, limit) => { const p = Math.max(1, parseInt(page)||1); const l = Math.min(100, parseInt(limit)||20); return { limit: l, offset: (p-1)*l, page: p }; };

const getTaxes = async (req, res) => {
  try {
    const { is_active, page, limit } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);
    const conditions = []; const params = []; let idx = 1;
    if (is_active !== undefined) { conditions.push(`is_active = $${idx++}`); params.push(is_active === 'true'); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countRes = await pool.query(`SELECT COUNT(*) FROM taxes ${where}`, params);
    const total = parseInt(countRes.rows[0].count);
    params.push(lim, offset);
    const { rows } = await pool.query(`SELECT * FROM taxes ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params);
    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total/lim) } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch taxes' }); }
};

const createTax = async (req, res) => {
  try {
    const { name, type, rate, description } = req.body;
    if (!name || !type || rate === undefined) return res.status(400).json({ success: false, error: 'Name, type, and rate are required' });
    const { rows } = await pool.query(
      'INSERT INTO taxes (name, type, rate, description, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, type, parseFloat(rate), description, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Tax created', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to create tax' }); }
};

const getTax = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM taxes WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Tax not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch tax' }); }
};

const updateTax = async (req, res) => {
  try {
    const { name, type, rate, description } = req.body;
    const { rows } = await pool.query(
      'UPDATE taxes SET name=COALESCE($1,name), type=COALESCE($2,type), rate=COALESCE($3,rate), description=COALESCE($4,description) WHERE id=$5 RETURNING *',
      [name, type, rate !== undefined ? parseFloat(rate) : null, description, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Tax not found' });
    res.json({ success: true, message: 'Tax updated', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update tax' }); }
};

const toggleTax = async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE taxes SET is_active = NOT is_active WHERE id=$1 RETURNING id, is_active', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Tax not found' });
    res.json({ success: true, message: 'Tax toggled', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to toggle tax' }); }
};

const deleteTax = async (req, res) => {
  try {
    const inUse = await pool.query('SELECT COUNT(*) FROM subscription_line_taxes WHERE tax_id=$1', [req.params.id]);
    if (parseInt(inUse.rows[0].count) > 0) return res.status(422).json({ success: false, error: 'Cannot delete — tax is in use by subscriptions' });
    const { rows } = await pool.query('DELETE FROM taxes WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Tax not found' });
    res.json({ success: true, message: 'Tax deleted' });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to delete tax' }); }
};

module.exports = { getTaxes, createTax, getTax, updateTax, toggleTax, deleteTax };
