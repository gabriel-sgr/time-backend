const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Multer config for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'settings');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = 'logo' + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// Multer config for background image upload
const bgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'settings');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = 'background' + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const bgUpload = multer({
  storage: bgStorage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST upload logo
router.post('/logo', protect, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Logo is required' });
    
    const settings = await Settings.getSettings();
    
    // Delete old logo if exists
    if (settings.logo_path) {
      const oldFilePath = path.join(__dirname, '..', settings.logo_path);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }
    
    settings.logo_path = '/uploads/settings/' + req.file.filename;
    await settings.save();
    
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update school name
router.put('/school-name', protect, async (req, res) => {
  try {
    const { school_name } = req.body;
    if (!school_name) return res.status(400).json({ message: 'School name is required' });
    
    const settings = await Settings.getSettings();
    settings.school_name = school_name;
    await settings.save();
    
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update assembly settings
router.put('/assembly', protect, async (req, res) => {
  try {
    const { assembly_day, assembly_start_time, assembly_end_time } = req.body;
    if (!assembly_day || !assembly_start_time || !assembly_end_time) {
      return res.status(400).json({ message: 'All assembly fields are required' });
    }
    
    const settings = await Settings.getSettings();
    settings.assembly_day = assembly_day;
    settings.assembly_start_time = assembly_start_time;
    settings.assembly_end_time = assembly_end_time;
    await settings.save();
    
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST upload background image
router.post('/background', protect, bgUpload.single('background'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Background image is required' });
    
    const settings = await Settings.getSettings();
    
    // Delete old background if exists
    if (settings.background_image_path) {
      const oldFilePath = path.join(__dirname, '..', settings.background_image_path);
      if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
    }
    
    settings.background_image_path = '/uploads/settings/' + req.file.filename;
    await settings.save();
    
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE background image
router.delete('/background', protect, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    if (settings.background_image_path) {
      const filePath = path.join(__dirname, '..', settings.background_image_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    
    settings.background_image_path = '';
    await settings.save();
    
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
