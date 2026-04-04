const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Readable } = require('stream');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const cloudinary = require('../utils/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/image', authenticate, requireRole('admin', 'internal'), upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file provided' });
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'prosubx/products', resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      const readable = new Readable();
      readable.push(req.file.buffer);
      readable.push(null);
      readable.pipe(stream);
    });
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, error: 'Image upload failed' });
  }
});

module.exports = router;
