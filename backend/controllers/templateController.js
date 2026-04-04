const pool = require('../db');
const getPagination = (p,l) => { const pg=Math.max(1,parseInt(p)||1); const lm=Math.min(100,parseInt(l)||20); return {limit:lm,offset:(pg-1)*lm,page:pg}; };

const getTemplates = async (req, res) => {
  try {
    const { is_active, page, limit } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);
    const conds=[]; const params=[]; let idx=1;
    if (is_active!==undefined) { conds.push(`t.is_active=$${idx++}`); params.push(is_active==='true'); }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';
    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM quotation_templates t ${where}`, params)).rows[0].count);
    params.push(lim, offset);
    const { rows } = await pool.query(
      `SELECT t.*, rp.name as plan_name FROM quotation_templates t LEFT JOIN recurring_plans rp ON rp.id=t.recurring_plan_id ${where} ORDER BY t.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`, params);
    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total/lim) } });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch templates' }); }
};

const createTemplate = async (req, res) => {
  try {
    const { name, validity_days, recurring_plan_id } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    const { rows } = await pool.query(
      'INSERT INTO quotation_templates (name, validity_days, recurring_plan_id, created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, validity_days||30, recurring_plan_id||null, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Template created', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to create template' }); }
};

const getTemplate = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, rp.name as plan_name,
       json_agg(json_build_object('id',tl.id,'product_id',tl.product_id,'quantity',tl.quantity,'unit_price',tl.unit_price,'product_name',p.name)) FILTER (WHERE tl.id IS NOT NULL) as lines
       FROM quotation_templates t LEFT JOIN recurring_plans rp ON rp.id=t.recurring_plan_id
       LEFT JOIN quotation_template_lines tl ON tl.template_id=t.id LEFT JOIN products p ON p.id=tl.product_id
       WHERE t.id=$1 GROUP BY t.id,rp.name`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to fetch template' }); }
};

const updateTemplate = async (req, res) => {
  try {
    const { name, validity_days, recurring_plan_id } = req.body;
    const { rows } = await pool.query(
      'UPDATE quotation_templates SET name=COALESCE($1,name),validity_days=COALESCE($2,validity_days),recurring_plan_id=COALESCE($3,recurring_plan_id) WHERE id=$4 RETURNING *',
      [name, validity_days, recurring_plan_id, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, message: 'Template updated', data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update template' }); }
};

const addTemplateLine = async (req, res) => {
  try {
    const { product_id, quantity, unit_price } = req.body;
    if (!product_id || !unit_price) return res.status(400).json({ success: false, error: 'product_id and unit_price are required' });
    const { rows } = await pool.query(
      'INSERT INTO quotation_template_lines (template_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, product_id, quantity||1, parseFloat(unit_price)]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to add template line' }); }
};

const updateTemplateLine = async (req, res) => {
  try {
    const { quantity, unit_price } = req.body;
    const { rows } = await pool.query(
      'UPDATE quotation_template_lines SET quantity=COALESCE($1,quantity),unit_price=COALESCE($2,unit_price) WHERE id=$3 AND template_id=$4 RETURNING *',
      [quantity, unit_price !== undefined ? parseFloat(unit_price) : null, req.params.lid, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Line not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to update template line' }); }
};

const deleteTemplateLine = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM quotation_template_lines WHERE id=$1 AND template_id=$2 RETURNING id', [req.params.lid, req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Line not found' });
    res.json({ success: true, message: 'Line deleted' });
  } catch (err) { res.status(500).json({ success: false, error: 'Failed to delete template line' }); }
};

module.exports = { getTemplates, createTemplate, getTemplate, updateTemplate, addTemplateLine, updateTemplateLine, deleteTemplateLine };
