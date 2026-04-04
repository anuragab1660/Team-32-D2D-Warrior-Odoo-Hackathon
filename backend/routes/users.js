const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const c = require('../controllers/userController');

router.use(authenticate);
router.get('/', requireRole('admin'), c.getUsers);
router.get('/internal', requireRole('admin'), c.getInternalUsers);
router.post('/create-internal', requireRole('admin'), c.createInternalUser);
router.post('/invite', requireRole('admin'), c.inviteUser);
router.patch('/:id/toggle', requireRole('admin'), c.toggleUser);
router.post('/:id/resend-invite', requireRole('admin'), c.resendInvite);

module.exports = router;
