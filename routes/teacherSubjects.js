const express = require('express');
const TeacherSubject = require('../models/TeacherSubject');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all teacher-subject assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await TeacherSubject.find({ is_active: true })
      .populate('teacher_id', 'name email')
      .populate('subject_id', 'name')
      .sort({ teacher_id: 1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get subjects for a specific teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const assignments = await TeacherSubject.find({ 
      teacher_id: req.params.teacherId, 
      is_active: true 
    })
      .populate('subject_id', 'name')
      .sort({ subject_id: 1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get teachers for a specific subject
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const assignments = await TeacherSubject.find({ 
      subject_id: req.params.subjectId, 
      is_active: true 
    })
      .populate('teacher_id', 'name email')
      .populate('subject_id', 'name')
      .sort({ teacher_id: 1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create or update teacher-subject assignment
router.post('/', protect, async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;
    const assignment = await TeacherSubject.findOneAndUpdate(
      { teacher_id, subject_id },
      { is_active: true },
      { upsert: true, new: true }
    ).populate('teacher_id', 'name email').populate('subject_id', 'name');
    res.status(201).json(assignment);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update teacher-subject assignment
router.put('/:id', protect, async (req, res) => {
  try {
    const assignment = await TeacherSubject.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('teacher_id', 'name email').populate('subject_id', 'name');
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json(assignment);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Delete teacher-subject assignment (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    await TeacherSubject.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove subject from teacher
router.delete('/teacher/:teacherId/subject/:subjectId', protect, async (req, res) => {
  try {
    await TeacherSubject.findOneAndUpdate(
      { teacher_id: req.params.teacherId, subject_id: req.params.subjectId },
      { is_active: false }
    );
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
