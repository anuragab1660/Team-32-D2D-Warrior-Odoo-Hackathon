const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  login, signup, verifyEmail, createInternalUser, acceptInvite,
  resendInvite, forgotPassword, resetPassword, refreshToken, getMe, updateProfile
} = require('../controllers/authController');

router.post('/login', login);
router.post('/signup', signup);
router.get('/verify-email', verifyEmail);
router.post('/accept-invite', acceptInvite);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

router.use(authenticate);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/internal-users', requireRole('admin'), createInternalUser);
router.post('/resend-invite', requireRole('admin'), resendInvite);

module.exports = router;
