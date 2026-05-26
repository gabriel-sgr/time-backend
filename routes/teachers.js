const express = require('express');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await Teacher.find().populate('subject_ids', 'name').sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, subject_ids } = req.body;
    const item = await Teacher.create({ name, subject_ids: subject_ids || [] });
    await item.populate('subject_ids', 'name');
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Assign subject to teacher
router.post('/assign-subject', protect, async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;
    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    
    if (!teacher.subject_ids.includes(subject_id)) {
      teacher.subject_ids.push(subject_id);
      await teacher.save();
    }
    await teacher.populate('subject_ids', 'name');
    res.json(teacher);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Remove subject from teacher
router.post('/remove-subject', protect, async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;
    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    
    teacher.subject_ids = teacher.subject_ids.filter(id => id.toString() !== subject_id);
    await teacher.save();
    await teacher.populate('subject_ids', 'name');
    res.json(teacher);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { name, subject_ids } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (subject_ids !== undefined) updateData.subject_ids = subject_ids;
    const item = await Teacher.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('subject_ids', 'name');
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get teachers by subject
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const items = await Teacher.find({ subject_ids: req.params.subjectId }).populate('subject_ids', 'name').sort({ name: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
