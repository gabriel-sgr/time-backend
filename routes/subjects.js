const express = require('express');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { class_id } = req.query;
    let query = {};
    if (class_id) {
      query.class_ids = { $in: [class_id] };
    }
    const items = await Subject.find(query).populate('class_ids', 'name').sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const items = await Subject.find({ class_ids: req.params.classId }).populate('class_ids', 'name').sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, class_ids, weekly_hours } = req.body;
    const item = await Subject.create({ name, class_ids: class_ids || [], weekly_hours: weekly_hours || 1 });
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Assign subject to class
router.post('/assign-to-class', protect, async (req, res) => {
  try {
    const { subject_id, class_id } = req.body;
    const subject = await Subject.findById(subject_id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    if (!subject.class_ids.includes(class_id)) {
      subject.class_ids.push(class_id);
      await subject.save();
    }
    await subject.populate('class_ids', 'name');
    res.json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Remove subject from class
router.post('/remove-from-class', protect, async (req, res) => {
  try {
    const { subject_id, class_id } = req.body;
    const subject = await Subject.findById(subject_id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    
    subject.class_ids = subject.class_ids.filter(id => id.toString() !== class_id);
    await subject.save();
    await subject.populate('class_ids', 'name');
    res.json(subject);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { name, class_ids, weekly_hours } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (class_ids !== undefined) updateData.class_ids = class_ids;
    if (weekly_hours !== undefined) updateData.weekly_hours = weekly_hours;
    const item = await Subject.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('class_ids', 'name');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
