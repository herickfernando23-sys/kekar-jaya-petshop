const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public', 'images');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use original file name, but you can customize
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// POST /upload-image
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the relative path to be saved in DB
  const relativePath = '/images/' + req.file.filename;
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' && forwardedProto ? forwardedProto.split(',')[0].trim() : 'https';
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = (typeof forwardedHost === 'string' && forwardedHost ? forwardedHost : req.get('host')) || '';
  const publicBaseUrl = host ? `${protocol}://${String(host).replace(/\/+$/, '')}` : '';

  res.json({ imageUrl: publicBaseUrl ? `${publicBaseUrl}${relativePath}` : relativePath });
});

module.exports = router;
