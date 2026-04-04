const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  login, signup, verifyEmail, createInternalUser, acceptInvite,
<<<<<<< HEAD
  resendInvite, forgotPassword, resetPassword, refreshToken, getMe,
  changePassword, updateProfile,
=======
  resendInvite, forgotPassword, resetPassword, refreshToken, getMe, updateProfile
>>>>>>> a124855036b2bfa396882831dba2607e0654b7cb
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
<<<<<<< HEAD
router.post('/change-password', changePassword);
=======
>>>>>>> a124855036b2bfa396882831dba2607e0654b7cb
router.put('/profile', updateProfile);
router.post('/internal-users', requireRole('admin'), createInternalUser);
router.post('/resend-invite', requireRole('admin'), resendInvite);

module.exports = router;
