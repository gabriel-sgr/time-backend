const express = require('express');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all activities (optionally filter by class_id)
router.get('/', async (req, res) => {
  try {
    const { class_id } = req.query;
    let query = {};
    if (class_id) query.class_id = class_id;
    const items = await Activity.find(query)
      .populate('class_id', 'name')
      .populate('responsible_teacher_id', 'name')
      .sort({ day_of_week: 1, start_time: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get activities for a specific class
router.get('/class/:classId', async (req, res) => {
  try {
    const items = await Activity.find({ class_id: req.params.classId })
      .populate('class_id', 'name')
      .populate('responsible_teacher_id', 'name')
      .sort({ day_of_week: 1, start_time: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create new activity
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, class_id, day_of_week, start_time, end_time, location, responsible_teacher_id } = req.body;
    const item = await Activity.create({
      name, description, class_id, day_of_week, start_time, end_time, location, responsible_teacher_id
    });
    await item.populate('class_id', 'name');
    await item.populate('responsible_teacher_id', 'name');
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update activity
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, class_id, day_of_week, start_time, end_time, location, responsible_teacher_id } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (class_id !== undefined) updateData.class_id = class_id;
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (location !== undefined) updateData.location = location;
    if (responsible_teacher_id !== undefined) updateData.responsible_teacher_id = responsible_teacher_id;

    const item = await Activity.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('class_id', 'name')
      .populate('responsible_teacher_id', 'name');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Delete activity
router.delete('/:id', protect, async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
