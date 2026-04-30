const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Announcement = require('../models/Announcement');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Multer config for images
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'announcements');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Multer config for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'announcements');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|webm|ogg|mov/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only video files are allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// GET active announcements (public)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      $or: [
        { expires_at: null },
        { expires_at: { $gt: now } }
      ]
    }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all announcements (admin)
router.get('/all', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST upload announcement
router.post('/', protect, async (req, res) => {
  try {
    const { type, title, content, expires_at } = req.body;
    
    if (!type) return res.status(400).json({ message: 'Type is required' });
    
    let announcementData = {
      type,
      title: title || '',
      expires_at: expires_at || null
    };

    if (type === 'text') {
      if (!content) return res.status(400).json({ message: 'Content is required for text announcements' });
      announcementData.content = content;
    } else if (type === 'image') {
      if (!req.file) return res.status(400).json({ message: 'Image is required for image announcements' });
      announcementData.image_path = '/uploads/announcements/' + req.file.filename;
    } else if (type === 'video') {
      if (!req.file) return res.status(400).json({ message: 'Video is required for video announcements' });
      announcementData.video_path = '/uploads/announcements/' + req.file.filename;
    }

    const announcement = await Announcement.create(announcementData);
    res.status(201).json(announcement);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST upload image announcement
router.post('/image', protect, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image is required' });
    const announcement = await Announcement.create({
      type: 'image',
      title: req.body.title || '',
      image_path: '/uploads/announcements/' + req.file.filename,
      expires_at: req.body.expires_at || null
    });
    res.status(201).json(announcement);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST upload video announcement
router.post('/video', protect, videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Video is required' });
    const announcement = await Announcement.create({
      type: 'video',
      title: req.body.title || '',
      video_path: '/uploads/announcements/' + req.file.filename,
      expires_at: req.body.expires_at || null
    });
    res.status(201).json(announcement);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST text announcement
router.post('/text', protect, async (req, res) => {
  try {
    const { title, content, expires_at } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required for text announcements' });
    const announcement = await Announcement.create({
      type: 'text',
      title: title || '',
      content,
      expires_at: expires_at || null
    });
    res.status(201).json(announcement);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Not found' });
    
    // Delete file based on type
    if (ann.type === 'image' && ann.image_path) {
      const filePath = path.join(__dirname, '..', ann.image_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else if (ann.type === 'video' && ann.video_path) {
      const filePath = path.join(__dirname, '..', ann.video_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
