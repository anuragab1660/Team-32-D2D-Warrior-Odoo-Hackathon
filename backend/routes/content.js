const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const c = require('../controllers/contentController');

router.use(authenticate, requireRole('admin', 'internal'));
router.get('/', c.getContentBlocks);
router.post('/', c.createContentBlock);
router.put('/:id', c.updateContentBlock);
router.patch('/:id/toggle', c.toggleContentBlock);
router.delete('/:id', requireRole('admin'), c.deleteContentBlock);

module.exports = router;
