const pool = require('../db');
const bcrypt = require('bcrypt');
const { generateToken, hashToken } = require('../utils/tokenHelpers');
const { sendInviteEmail } = require('../utils/email');

const getUsers = async (req, res) => {
  try {
    const { role, is_active, search } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (role) { conditions.push(`u.role = $${idx++}`); params.push(role); }
    if (is_active !== undefined) { conditions.push(`u.is_active = $${idx++}`); params.push(is_active === 'true'); }
    if (search) { conditions.push(`(u.name ILIKE $${idx++} OR u.email ILIKE $${idx++})`); params.push(`%${search}%`, `%${search}%`); idx++; }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.is_email_verified,
              u.invite_accepted_at, u.created_at,
              creator.name as created_by_name
       FROM users u
       LEFT JOIN users creator ON creator.id = u.created_by
       ${where}
       ORDER BY u.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

const inviteUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    if (!['admin', 'internal'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Only admin and internal users can be invited by admin.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const inviteToken = generateToken();
    const inviteTokenHash = hashToken(inviteToken);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        `INSERT INTO users (name, email, role, created_by, invite_token, invite_token_exp)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '48 hours')
         RETURNING id, name, email, role`,
        [name || email.split('@')[0], email.toLowerCase(), role, req.user.id, inviteTokenHash]
      );
      const newUser = userRes.rows[0];

      await client.query(
        `INSERT INTO user_invitations (user_id, invited_by, email, invite_token, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '48 hours')`,
        [newUser.id, req.user.id, email.toLowerCase(), inviteTokenHash]
      );
      await client.query('COMMIT');

      try { await sendInviteEmail(email, name || '', inviteToken); } catch (emailErr) { console.error('Email send failed:', emailErr); }

      res.status(201).json({
        success: true,
        message: `Invite sent to ${email}`,
        data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to invite user' });
  }
};

const toggleUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate yourself' });
    }
    const { rows } = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active, name, email, role',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: `User ${rows[0].is_active ? 'activated' : 'deactivated'}`, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to toggle user' });
  }
};

const resendInvite = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND invite_accepted_at IS NULL',
      [req.params.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, error: 'User not found or already accepted invite' });

    const inviteToken = generateToken();
    const inviteTokenHash = hashToken(inviteToken);

    await pool.query(
      'UPDATE users SET invite_token = $1, invite_token_exp = NOW() + INTERVAL \'48 hours\' WHERE id = $2',
      [inviteTokenHash, user.id]
    );
    await pool.query(
      `INSERT INTO user_invitations (user_id, invited_by, email, invite_token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '48 hours')`,
      [user.id, req.user.id, user.email, inviteTokenHash]
    );

    try { await sendInviteEmail(user.email, user.name, inviteToken); } catch (emailErr) { console.error('Email send failed:', emailErr); }

    res.json({ success: true, message: `Invite resent to ${user.email}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to resend invite' });
  }
};

const getInternalUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, is_email_verified, created_at
       FROM users WHERE role = 'internal' ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch internal users' });
  }
};

const createInternalUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must contain uppercase, lowercase, and a number' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active, is_email_verified, invite_accepted_at, created_by)
       VALUES ($1, $2, $3, 'internal', true, true, NOW(), $4)
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email.toLowerCase(), passwordHash, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Employee created successfully', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create employee' });
  }
};

module.exports = { getUsers, inviteUser, toggleUser, resendInvite, getInternalUsers, createInternalUser };
