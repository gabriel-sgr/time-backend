const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Settings = require('../models/Settings');
const Timetable = require('../models/Timetable');
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
    const oldDay = settings.assembly_day || 1;
    const oldStartTime = settings.assembly_start_time || '07:50';
    const oldEndTime = settings.assembly_end_time || '08:10';

    settings.assembly_day = assembly_day;
    settings.assembly_start_time = assembly_start_time;
    settings.assembly_end_time = assembly_end_time;
    await settings.save();

    // Update timetable entries for assembly
    // Find all assembly entries (those with "Assembly" in the subject name or identified as assembly)
    const assemblyEntries = await Timetable.find({
      $or: [
        { 'subject_id.name': { $regex: /assembly/i } },
        { start_time: oldStartTime, end_time: oldEndTime, day_of_week: oldDay }
      ]
    });

    // Update each assembly entry
    for (const entry of assemblyEntries) {
      entry.day_of_week = assembly_day;
      entry.start_time = assembly_start_time;
      entry.end_time = assembly_end_time;
      await entry.save();
    }

    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST add free time
router.post('/free-time', protect, async (req, res) => {
  try {
    const { day_of_week, start_time, end_time, label } = req.body;
    if (!day_of_week || !start_time || !end_time) {
      return res.status(400).json({ message: 'Day, start time, and end time are required' });
    }

    const settings = await Settings.getSettings();
    settings.free_times.push({ day_of_week, start_time, end_time, label: label || 'Free Time' });
    await settings.save();

    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update free time
router.put('/free-time/:index', protect, async (req, res) => {
  try {
    const { index } = req.params;
    const { day_of_week, start_time, end_time, label } = req.body;

    const settings = await Settings.getSettings();
    if (!settings.free_times[index]) {
      return res.status(404).json({ message: 'Free time not found' });
    }

    if (day_of_week !== undefined) settings.free_times[index].day_of_week = day_of_week;
    if (start_time !== undefined) settings.free_times[index].start_time = start_time;
    if (end_time !== undefined) settings.free_times[index].end_time = end_time;
    if (label !== undefined) settings.free_times[index].label = label;

    await settings.save();
    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE free time
router.delete('/free-time/:index', protect, async (req, res) => {
  try {
    const { index } = req.params;

    const settings = await Settings.getSettings();
    if (!settings.free_times[index]) {
      return res.status(404).json({ message: 'Free time not found' });
    }

    settings.free_times.splice(index, 1);
    await settings.save();

    res.json(settings);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
