const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const c = require('../controllers/productController');

router.use(authenticate);
router.get('/', c.getProducts);
router.post('/', requireRole('admin', 'internal'), c.createProduct);
router.get('/:id', c.getProduct);
router.put('/:id', requireRole('admin', 'internal'), c.updateProduct);
router.patch('/:id/toggle', requireRole('admin'), c.toggleProduct);
router.delete('/:id', requireRole('admin'), c.deleteProduct);
router.get('/:id/variants', c.getVariants);
router.post('/:id/variants', requireRole('admin', 'internal'), c.createVariant);
router.put('/:id/variants/:vid', requireRole('admin', 'internal'), c.updateVariant);
router.delete('/:id/variants/:vid', requireRole('admin'), c.deleteVariant);

module.exports = router;
