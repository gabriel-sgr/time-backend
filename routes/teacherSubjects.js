const express = require('express');
const TeacherSubject = require('../models/TeacherSubject');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all teacher-subject assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await TeacherSubject.find({ is_active: true })
      .populate({
        path: 'teacher_id',
        select: 'name email'
      })
      .populate({
        path: 'subject_id',
        select: 'name'
      })
      .sort({ 'teacher_id.name': 1 });
    
    // Filter out any assignments where populated refs are missing
    const validAssignments = assignments.filter(a => a.teacher_id && a.subject_id);
    
    res.json(validAssignments);
  } catch (err) { 
    console.error('Error fetching teacher-subject assignments:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// Get subjects for a specific teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const assignments = await TeacherSubject.find({ 
      teacher_id: req.params.teacherId, 
      is_active: true 
    })
      .populate({
        path: 'subject_id',
        select: 'name'
      })
      .sort({ 'subject_id.name': 1 });
    res.json(assignments);
  } catch (err) { 
    console.error('Error fetching subjects for teacher:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// Get teachers for a specific subject
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const assignments = await TeacherSubject.find({ 
      subject_id: req.params.subjectId, 
      is_active: true 
    })
      .populate({
        path: 'teacher_id',
        select: 'name email'
      })
      .populate({
        path: 'subject_id',
        select: 'name'
      })
      .sort({ 'teacher_id.name': 1 });
    res.json(assignments);
  } catch (err) { 
    console.error('Error fetching teachers for subject:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// Create or update teacher-subject assignment
router.post('/', protect, async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;
    
    if (!teacher_id || !subject_id) {
      return res.status(400).json({ message: 'Teacher ID and Subject ID are required' });
    }

    const assignment = await TeacherSubject.findOneAndUpdate(
      { teacher_id, subject_id },
      { is_active: true },
      { upsert: true, new: true }
    )
      .populate({
        path: 'teacher_id',
        select: 'name email'
      })
      .populate({
        path: 'subject_id',
        select: 'name'
      });
    
    res.status(201).json(assignment);
  } catch (err) { 
    console.error('Error creating teacher-subject assignment:', err);
    res.status(400).json({ message: err.message }); 
  }
});

// Bulk create/update teacher-subject assignments (assign multiple subjects to a teacher)
router.post('/bulk-assign/subjects', protect, async (req, res) => {
  try {
    const { teacher_id, subject_ids } = req.body;
    
    if (!teacher_id || !Array.isArray(subject_ids) || subject_ids.length === 0) {
      return res.status(400).json({ message: 'teacher_id and subject_ids array are required' });
    }

    const assignments = [];
    for (const subject_id of subject_ids) {
      const assignment = await TeacherSubject.findOneAndUpdate(
        { teacher_id, subject_id },
        { is_active: true },
        { upsert: true, new: true }
      )
        .populate({
          path: 'teacher_id',
          select: 'name email'
        })
        .populate({
          path: 'subject_id',
          select: 'name'
        });
      assignments.push(assignment);
    }
    
    res.status(201).json(assignments);
  } catch (err) { 
    console.error('Error creating bulk teacher-subject assignments:', err);
    res.status(400).json({ message: err.message }); 
  }
});

// Update teacher-subject assignment
router.put('/:id', protect, async (req, res) => {
  try {
    const assignment = await TeacherSubject.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    )
      .populate({
        path: 'teacher_id',
        select: 'name email'
      })
      .populate({
        path: 'subject_id',
        select: 'name'
      });
    
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    res.json(assignment);
  } catch (err) { 
    console.error('Error updating teacher-subject assignment:', err);
    res.status(400).json({ message: err.message }); 
  }
});

// Delete teacher-subject assignment (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    const assignment = await TeacherSubject.findByIdAndUpdate(
      req.params.id, 
      { is_active: false },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) { 
    console.error('Error deleting teacher-subject assignment:', err);
    res.status(500).json({ message: err.message }); 
  }
});

// Remove subject from teacher
router.delete('/teacher/:teacherId/subject/:subjectId', protect, async (req, res) => {
  try {
    const assignment = await TeacherSubject.findOneAndUpdate(
      { teacher_id: req.params.teacherId, subject_id: req.params.subjectId },
      { is_active: false },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    res.json({ message: 'Subject removed from teacher successfully' });
  } catch (err) { 
    console.error('Error removing subject from teacher:', err);
    res.status(500).json({ message: err.message }); 
  }
});

module.exports = router;
