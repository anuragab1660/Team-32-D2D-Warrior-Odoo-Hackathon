const pool = require('../db');

const getPagination = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  return { limit: l, offset: (p - 1) * l, page: p };
};

const getProducts = async (req, res) => {
  try {
    const { is_active, type, page, limit, search } = req.query;
    const { limit: lim, offset, page: pg } = getPagination(page, limit);

    const conditions = [];
    const params = [];
    let idx = 1;

    if (is_active !== undefined) { conditions.push(`p.is_active = $${idx++}`); params.push(is_active === 'true'); }
    if (type) { conditions.push(`p.product_type = $${idx++}`); params.push(type); }
    if (search) { conditions.push(`p.name ILIKE $${idx++}`); params.push(`%${search}%`); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM products p ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(lim, offset);
    const { rows } = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true) as variant_count,
              u.name as created_by_name
       FROM products p
       LEFT JOIN users u ON u.id = p.created_by
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    res.json({ success: true, data: rows, pagination: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, product_type, description, sales_price, cost_price, image_url } = req.body;
    if (!name || sales_price === undefined || cost_price === undefined) {
      return res.status(400).json({ success: false, error: 'Name, sales_price, and cost_price are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO products (name, product_type, description, sales_price, cost_price, image_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, product_type || 'service', description, parseFloat(sales_price), parseFloat(cost_price), image_url || null, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Product created', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
};

const getProduct = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, array_agg(pv.*) FILTER (WHERE pv.id IS NOT NULL) as variants
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, product_type, description, sales_price, cost_price, image_url } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET name = COALESCE($1, name), product_type = COALESCE($2, product_type),
       description = COALESCE($3, description), sales_price = COALESCE($4, sales_price),
       cost_price = COALESCE($5, cost_price), image_url = COALESCE($6, image_url)
       WHERE id = $7 RETURNING *`,
      [name, product_type, description, sales_price !== undefined ? parseFloat(sales_price) : null, cost_price !== undefined ? parseFloat(cost_price) : null, image_url !== undefined ? image_url : null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, message: 'Product updated', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
};

const toggleProduct = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE products SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, message: `Product ${rows[0].is_active ? 'activated' : 'deactivated'}`, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to toggle product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    if (err.code === '23503') return res.status(422).json({ success: false, error: 'Cannot delete — product is linked to subscriptions or templates' });
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
};

const getVariants = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch variants' });
  }
};

const createVariant = async (req, res) => {
  try {
    const { attribute, value, extra_price } = req.body;
    if (!attribute || !value) return res.status(400).json({ success: false, error: 'Attribute and value are required' });
    const { rows } = await pool.query(
      'INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, attribute, value, parseFloat(extra_price) || 0]
    );
    res.status(201).json({ success: true, message: 'Variant created', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create variant' });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { attribute, value, extra_price, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE product_variants SET attribute = COALESCE($1, attribute), value = COALESCE($2, value),
       extra_price = COALESCE($3, extra_price), is_active = COALESCE($4, is_active)
       WHERE id = $5 AND product_id = $6 RETURNING *`,
      [attribute, value, extra_price !== undefined ? parseFloat(extra_price) : null, is_active, req.params.vid, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Variant not found' });
    res.json({ success: true, message: 'Variant updated', data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update variant' });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM product_variants WHERE id = $1 AND product_id = $2 RETURNING id', [req.params.vid, req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Variant not found' });
    res.json({ success: true, message: 'Variant deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete variant' });
  }
};

module.exports = { getProducts, createProduct, getProduct, updateProduct, toggleProduct, deleteProduct, getVariants, createVariant, updateVariant, deleteVariant };
