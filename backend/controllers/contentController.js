const pool = require('../db');

// Ensure table exists on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS content_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(err => console.error('content_blocks table init error:', err.message));

const getContentBlocks = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cb.*,
             u1.name AS created_by_name,
             u2.name AS updated_by_name
      FROM content_blocks cb
      LEFT JOIN users u1 ON u1.id = cb.created_by
      LEFT JOIN users u2 ON u2.id = cb.updated_by
      ORDER BY cb.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch content blocks' });
  }
};

const createContentBlock = async (req, res) => {
  const { key, title, body } = req.body;
  if (!key || !title || !body) {
    return res.status(400).json({ success: false, error: 'key, title, and body are required' });
  }
  const safeKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  try {
    const { rows } = await pool.query(
      `INSERT INTO content_blocks (key, title, body, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [safeKey, title, body, req.user.id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'A content block with this key already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create content block' });
  }
};

const updateContentBlock = async (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ success: false, error: 'title and body are required' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE content_blocks
       SET title=$1, body=$2, updated_by=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [title, body, req.user.id, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Content block not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update content block' });
  }
};

const toggleContentBlock = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE content_blocks
       SET is_active = NOT is_active, updated_by=$1, updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [req.user.id, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Content block not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle content block' });
  }
};

const deleteContentBlock = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      'DELETE FROM content_blocks WHERE id=$1 RETURNING id',
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'Content block not found' });
    res.json({ success: true, message: 'Content block deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete content block' });
  }
};

module.exports = {
  getContentBlocks,
  createContentBlock,
  updateContentBlock,
  toggleContentBlock,
  deleteContentBlock,
};
