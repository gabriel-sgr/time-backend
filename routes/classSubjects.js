const express = require('express');
const ClassSubject = require('../models/ClassSubject');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all class-subject assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await ClassSubject.find({ is_active: true })
      .populate('class_id', 'name')
      .populate('subject_id', 'name')
      .sort({ class_id: 1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get subjects for a specific class
router.get('/class/:classId', async (req, res) => {
  try {
    const assignments = await ClassSubject.find({ 
      class_id: req.params.classId, 
      is_active: true 
    })
      .populate('subject_id', 'name')
      .sort({ subject_id: 1 });
    res.json(assignments);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create or update class-subject assignment
router.post('/', protect, async (req, res) => {
  try {
    const { class_id, subject_id, hours_per_week } = req.body;
    const assignment = await ClassSubject.findOneAndUpdate(
      { class_id, subject_id },
      { hours_per_week, is_active: true },
      { upsert: true, new: true }
    ).populate('class_id', 'name').populate('subject_id', 'name');
    res.status(201).json(assignment);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Bulk create/update class-subject assignments (assign multiple subjects to a class)
router.post('/bulk-assign/subjects', protect, async (req, res) => {
  try {
    const { class_id, subject_ids, hours_per_week } = req.body;
    
    if (!class_id || !Array.isArray(subject_ids) || subject_ids.length === 0) {
      return res.status(400).json({ message: 'class_id and subject_ids array are required' });
    }

    const assignments = [];
    for (const subject_id of subject_ids) {
      const assignment = await ClassSubject.findOneAndUpdate(
        { class_id, subject_id },
        { hours_per_week: hours_per_week || 1, is_active: true },
        { upsert: true, new: true }
      ).populate('class_id', 'name').populate('subject_id', 'name');
      assignments.push(assignment);
    }
    
    res.status(201).json(assignments);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update class-subject assignment
router.put('/:id', protect, async (req, res) => {
  try {
    const assignment = await ClassSubject.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    ).populate('class_id', 'name').populate('subject_id', 'name');
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json(assignment);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Delete class-subject assignment (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    await ClassSubject.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove subject from class
router.delete('/class/:classId/subject/:subjectId', protect, async (req, res) => {
  try {
    await ClassSubject.findOneAndUpdate(
      { class_id: req.params.classId, subject_id: req.params.subjectId },
      { is_active: false }
    );
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
