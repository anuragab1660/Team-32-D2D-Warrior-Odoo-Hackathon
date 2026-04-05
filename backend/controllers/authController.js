const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { generateToken, hashToken } = require('../utils/tokenHelpers');
const { sendInviteEmail, sendVerifyEmail, sendPasswordResetEmail } = require('../utils/email');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, error: 'Account is deactivated. Contact your administrator.' });
    }
    if (!user.password_hash) {
      return res.status(401).json({ success: false, error: 'Account setup incomplete. Please accept your invite.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.role === 'portal' && !user.is_email_verified) {
      return res.status(401).json({
        success: false,
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
      });
    }

    if (user.role === 'internal' && !user.invite_accepted_at) {
      return res.status(401).json({ success: false, error: 'Account not activated. Please accept the invite sent to your email.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, error: 'Email already registered', details: [{ field: 'email', message: 'This email is already in use' }] });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = generateToken();
    const verifyTokenHash = hashToken(verifyToken);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_email_verified)
         VALUES ($1, $2, $3, 'portal', false)
         RETURNING id, name, email, role`,
        [name, email.toLowerCase(), passwordHash]
      );
      const newUser = userRes.rows[0];

      await client.query(
        'UPDATE users SET verify_token = $1, verify_token_exp = NOW() + INTERVAL \''24 hours\'' WHERE id = $2',
        [verifyTokenHash, newUser.id]
      );

      await client.query('INSERT INTO customers (user_id) VALUES ($1)', [newUser.id]);

      await sendVerifyEmail(newUser.email, newUser.name, verifyToken);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Account created. Please verify your email to activate your account.',
        data: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Signup failed' });
  }
};

// GET /api/auth/verify-email?token=
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

    const tokenHash = hashToken(token);
    const { rows } = await pool.query(
      'SELECT id, verify_token_exp FROM users WHERE verify_token = $1 AND role = $2',
      [tokenHash, 'portal']
    );
    const user = rows[0];

    if (!user) return res.status(400).json({ success: false, error: 'This link has expired or is invalid. Please sign up again.' });
    if (new Date() > new Date(user.verify_token_exp)) {
      return res.status(400).json({ success: false, error: 'This link has expired. Please sign up again.' });
    }

    await pool.query(
      'UPDATE users SET is_email_verified = true, verify_token = NULL, verify_token_exp = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};

// POST /api/auth/internal-users (admin only)
const createInternalUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, error: 'Email already registered', details: [{ field: 'email', message: 'This email is already in use' }] });
    }

    const inviteToken = generateToken();
    const inviteTokenHash = hashToken(inviteToken);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userRes = await client.query(
        `INSERT INTO users (name, email, role, created_by, invite_token, invite_token_exp)
         VALUES ($1, $2, 'internal', $3, $4, NOW() + INTERVAL '48 hours')
         RETURNING id, name, email, role`,
        [name, email.toLowerCase(), req.user.id, inviteTokenHash]
      );
      const newUser = userRes.rows[0];

      await client.query(
        `INSERT INTO user_invitations (user_id, invited_by, email, invite_token, expires_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '48 hours')`,
        [newUser.id, req.user.id, email.toLowerCase(), inviteTokenHash]
      );
      await client.query('COMMIT');

      try { await sendInviteEmail(email, name, inviteToken); } catch (emailErr) { console.error('Email send failed:', emailErr); }

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
    res.status(500).json({ success: false, error: 'Failed to create internal user' });
  }
};

// POST /api/auth/accept-invite
const acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, error: 'Token and password are required' });

    const tokenHash = hashToken(token);
    const { rows } = await pool.query(
      'SELECT id, role, invite_token_exp FROM users WHERE invite_token = $1 AND role = ANY($2::text[])',
      [tokenHash, ['internal', 'admin']]
    );
    const user = rows[0];

    if (!user) return res.status(400).json({ success: false, error: 'This invitation has expired or is invalid.' });
    if (new Date() > new Date(user.invite_token_exp)) {
      return res.status(400).json({ success: false, error: 'This invitation has expired (48h limit). Ask your admin to resend.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `UPDATE users SET password_hash = $1, invite_token = NULL, invite_token_exp = NULL,
       is_email_verified = true, invite_accepted_at = NOW() WHERE id = $2`,
      [passwordHash, user.id]
    );
    await pool.query(
      `UPDATE user_invitations SET status = 'accepted', accepted_at = NOW()
       WHERE user_id = $1 AND status = 'pending'`,
      [user.id]
    );

    const { accessToken, refreshToken } = generateTokens(user.id);
    const updatedUser = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [user.id]);

    res.json({
      success: true,
      message: 'Account activated successfully',
      data: { accessToken, refreshToken, user: updatedUser.rows[0] },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to accept invite' });
  }
};

// POST /api/auth/resend-invite (admin only)
const resendInvite = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, error: 'user_id is required' });

    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1 AND role = $2',
      [user_id, 'internal']
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, error: 'Internal user not found' });

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

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Always return 200 to prevent email enumeration
    if (email) {
      const { rows } = await pool.query('SELECT id, name FROM users WHERE email = $1', [email.toLowerCase()]);
      if (rows[0]) {
        const resetToken = generateToken();
        const resetTokenHash = hashToken(resetToken);
        await pool.query(
          'UPDATE users SET reset_token = $1, reset_token_exp = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
          [resetTokenHash, rows[0].id]
        );
        try { await sendPasswordResetEmail(email, rows[0].name, resetToken); } catch (emailErr) { console.error('Email send failed:', emailErr); }
      }
    }
    res.json({ success: true, message: "If that email exists, we've sent a reset link." });
  } catch (err) {
    console.error(err);
    res.json({ success: true, message: "If that email exists, we've sent a reset link." });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, error: 'Token and password are required' });

    const tokenHash = hashToken(token);
    const { rows } = await pool.query(
      'SELECT id, reset_token_exp FROM users WHERE reset_token = $1',
      [tokenHash]
    );
    const user = rows[0];

    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired reset link.' });
    if (new Date() > new Date(user.reset_token_exp)) {
      return res.status(400).json({ success: false, error: 'This reset link has expired (1h limit). Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_exp = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Password reset failed' });
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, error: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { rows } = await pool.query('SELECT id, is_active FROM users WHERE id = $1', [decoded.userId]);
    if (!rows[0] || !rows[0].is_active) {
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.is_email_verified, u.created_at,
              c.id as customer_id, c.company_name, c.phone, c.address, c.city, c.state, c.country, c.postal_code, c.gstin
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to get user profile' });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ success: false, error: 'Both current and new password are required' });
  if (new_password.length < 8) return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'User not found' });
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, company_name, phone, address, city, state, country, postal_code, gstin } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (name) {
        await client.query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
      }
      // Update customer record if portal user
      if (req.user.role === 'portal') {
        await client.query(
          `UPDATE customers SET
            company_name = COALESCE($1, company_name),
            phone = COALESCE($2, phone),
            address = COALESCE($3, address),
            city = COALESCE($4, city),
            state = COALESCE($5, state),
            country = COALESCE($6, country),
            postal_code = COALESCE($7, postal_code),
            gstin = COALESCE($8, gstin)
           WHERE user_id = $9`,
          [company_name, phone, address, city, state, country, postal_code, gstin, req.user.id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.is_email_verified, u.created_at,
              c.id as customer_id, c.company_name, c.phone, c.address, c.city, c.state, c.country, c.postal_code, c.gstin
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Profile updated', data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

module.exports = { login, signup, verifyEmail, createInternalUser, acceptInvite, resendInvite, forgotPassword, resetPassword, refreshToken, getMe, changePassword, updateProfile };
