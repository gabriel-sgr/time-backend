const express = require('express');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const classes = await Class.find().sort({ name: 1 });
    res.json(classes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find({ class_ids: req.params.id }).populate('class_ids', 'name');
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const cls = await Class.create({ name: req.body.name });
    res.status(201).json(cls);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (typeof req.body.is_active === 'boolean') updateData.is_active = req.body.is_active;
    
    const cls = await Class.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!cls) return res.status(404).json({ message: 'Not found' });
    res.json(cls);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
