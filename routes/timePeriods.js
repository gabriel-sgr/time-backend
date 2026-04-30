const express = require('express');
const TimePeriod = require('../models/TimePeriod');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all time periods
router.get('/', async (req, res) => {
  try {
    const { day_of_week } = req.query;
    let query = { is_active: true };
    if (day_of_week) {
      const day = parseInt(day_of_week);
      if (!isNaN(day)) {
        // For specific day, also include periods that cover this day
        query.$or = [
          { day_of_week: day },
          { day_of_week: 'every' },
          { day_of_week: day <= 5 ? 'mon-fri' : null }
        ];
      }
    }
    
    const periods = await TimePeriod.find(query).sort({ day_of_week: 1, start_time: 1 });
    res.json(periods);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get time periods by day
router.get('/day/:day', async (req, res) => {
  try {
    const periods = await TimePeriod.find({ 
      day_of_week: parseInt(req.params.day), 
      is_active: true 
    }).sort({ start_time: 1 });
    res.json(periods);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create time period - expand mon-fri and every into multiple entries
router.post('/', protect, async (req, res) => {
  try {
    const { name, start_time, end_time, day_of_week } = req.body;
    let createdPeriods = [];
    
    if (day_of_week === 'mon-fri') {
      // Create 5 entries for Monday through Friday
      for (let day = 1; day <= 5; day++) {
        const period = await TimePeriod.create({
          name: `${name}`,
          start_time,
          end_time,
          day_of_week: day,
          is_active: true
        });
        createdPeriods.push(period);
      }
    } else if (day_of_week === 'every') {
      // Create 7 entries for all days
      for (let day = 1; day <= 7; day++) {
        const period = await TimePeriod.create({
          name: `${name}`,
          start_time,
          end_time,
          day_of_week: day,
          is_active: true
        });
        createdPeriods.push(period);
      }
    } else {
      // Single day entry
      const period = await TimePeriod.create(req.body);
      createdPeriods.push(period);
    }
    
    res.status(201).json(createdPeriods.length === 1 ? createdPeriods[0] : createdPeriods);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Update time period
router.put('/:id', protect, async (req, res) => {
  try {
    const period = await TimePeriod.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!period) return res.status(404).json({ message: 'Not found' });
    res.json(period);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Delete time period
router.delete('/:id', protect, async (req, res) => {
  try {
    await TimePeriod.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
