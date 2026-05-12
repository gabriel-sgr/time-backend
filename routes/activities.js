const express = require('express');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all activities (optionally filter by class_id)
router.get('/', async (req, res) => {
  try {
    const { class_id, special_only } = req.query;
    let query = {};
    if (class_id) {
      query.$or = [
        { class_id: class_id },
        { class_ids: class_id },
        { all_classes: true }
      ];
    }
    if (special_only === 'true') {
      query.is_special = true;
    }
    const items = await Activity.find(query)
      .populate('class_id', 'name')
      .populate('class_ids', 'name')
      .populate('time_period_id', 'name start_time end_time')
      .populate('responsible_teacher_id', 'name')
      .sort({ day_of_week: 1, start_time: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get special activities for display page (all_classes activities)
router.get('/display/special-activities', async (req, res) => {
  try {
    const items = await Activity.find({
      is_special: true,
      all_classes: true
    })
      .populate('time_period_id', 'name start_time end_time day_of_week')
      .populate('responsible_teacher_id', 'name')
      .sort({ day_of_week: 1, start_time: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get activities for a specific class
router.get('/class/:classId', async (req, res) => {
  try {
    const items = await Activity.find({
      $or: [
        { class_id: req.params.classId },
        { class_ids: req.params.classId },
        { all_classes: true }
      ]
    })
      .populate('class_id', 'name')
      .populate('class_ids', 'name')
      .populate('responsible_teacher_id', 'name')
      .sort({ day_of_week: 1, start_time: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create new activity
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, class_id, class_ids, all_classes, is_special, day_of_week, start_time, end_time, time_period_id, location, responsible_teacher_id } = req.body;
    
    // If is_special is true, use class_ids or all_classes. Otherwise, use single class_id for backward compatibility
    let activityData = {
      name, description, day_of_week, start_time, end_time, location, responsible_teacher_id,
      is_special: is_special || false,
      all_classes: all_classes || false,
      time_period_id: time_period_id || undefined
    };

    if (is_special) {
      if (all_classes) {
        activityData.all_classes = true;
        activityData.class_ids = [];
      } else {
        activityData.class_ids = class_ids || [];
      }
    } else {
      activityData.class_id = class_id;
    }

    const item = await Activity.create(activityData);
    
    await item.populate('class_id', 'name');
    await item.populate('class_ids', 'name');
    await item.populate('time_period_id', 'name start_time end_time');
    await item.populate('responsible_teacher_id', 'name');
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update activity
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, class_id, class_ids, all_classes, is_special, day_of_week, start_time, end_time, time_period_id, location, responsible_teacher_id } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (location !== undefined) updateData.location = location;
    if (responsible_teacher_id !== undefined) updateData.responsible_teacher_id = responsible_teacher_id;
    if (time_period_id !== undefined) updateData.time_period_id = time_period_id;
    
    if (is_special !== undefined) updateData.is_special = is_special;
    if (all_classes !== undefined) updateData.all_classes = all_classes;
    
    if (is_special !== undefined && is_special) {
      if (all_classes !== undefined && all_classes) {
        updateData.all_classes = true;
        updateData.class_ids = [];
        updateData.class_id = undefined;
      } else if (class_ids !== undefined) {
        updateData.class_ids = class_ids;
        updateData.class_id = undefined;
      }
    } else if (is_special !== undefined && !is_special) {
      updateData.class_id = class_id;
      updateData.class_ids = [];
      updateData.all_classes = false;
    } else if (class_id !== undefined) {
      updateData.class_id = class_id;
    } else if (class_ids !== undefined) {
      updateData.class_ids = class_ids;
    }

    const item = await Activity.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('class_id', 'name')
      .populate('class_ids', 'name')
      .populate('time_period_id', 'name start_time end_time')
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
