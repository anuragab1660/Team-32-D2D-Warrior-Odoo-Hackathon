const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

router.use(authenticate);

// GET /api/customers — list all customers (admin/internal)
router.get('/', requireRole('admin', 'internal'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT c.id, c.user_id, c.company_name, c.phone, c.gstin,
                        u.name, u.email, u.is_active
                 FROM customers c
                 JOIN users u ON u.id = c.user_id`;
    const params = [];
    if (search) {
      query += ` WHERE u.name ILIKE $1 OR u.email ILIKE $1 OR c.company_name ILIKE $1`;
      params.push(`%${search}%`);
    }
    query += ' ORDER BY u.name ASC';
    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

module.exports = router;
