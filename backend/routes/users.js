const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const c = require('../controllers/userController');

router.use(authenticate);
router.get('/', requireRole('admin'), c.getUsers);
router.post('/invite', requireRole('admin'), c.inviteUser);
router.patch('/:id/toggle', requireRole('admin'), c.toggleUser);
router.post('/:id/resend-invite', requireRole('admin'), c.resendInvite);

module.exports = router;
