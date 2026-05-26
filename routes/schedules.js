const express = require('express');
const Schedule = require('../models/Schedule');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get all schedules
router.get('/', async (req, res) => {
  try {
    const { day_of_week } = req.query;
    let query = {};
    if (day_of_week) query.day_of_week = day_of_week;
    const items = await Schedule.find(query).sort({ day_of_week: 1, 'periods.start_time': 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create default school schedule
router.post('/create-default', protect, async (req, res) => {
  try {
    // Clear existing schedules
    await Schedule.deleteMany({});
    
    const defaultSchedules = [
      // Monday, Tuesday, Thursday, Friday
      {
        name: 'Regular Day',
        day_of_week: 1, // Monday
        periods: [
          { name: 'Morning Self Study', start_time: '05:00', end_time: '07:00', is_class: false, is_activity: true },
          { name: 'Breakfast', start_time: '07:00', end_time: '07:30', is_class: false, is_break: true },
          { name: 'Period 1', start_time: '08:10', end_time: '08:50', is_class: true },
          { name: 'Period 2', start_time: '08:50', end_time: '09:30', is_class: true },
          { name: 'Period 3', start_time: '09:30', end_time: '10:10', is_class: true },
          { name: 'Break', start_time: '10:10', end_time: '10:25', is_class: false, is_break: true },
          { name: 'Period 4', start_time: '10:25', end_time: '11:05', is_class: true },
          { name: 'Period 5', start_time: '11:05', end_time: '11:45', is_class: true },
          { name: 'Period 6', start_time: '11:45', end_time: '12:25', is_class: true },
          { name: 'Lunch', start_time: '12:25', end_time: '13:30', is_class: false, is_break: true },
          { name: 'Period 7', start_time: '13:30', end_time: '14:10', is_class: true },
          { name: 'Period 8', start_time: '14:10', end_time: '14:50', is_class: true },
          { name: 'Period 9', start_time: '14:50', end_time: '15:30', is_class: true },
          { name: 'Break', start_time: '15:30', end_time: '15:40', is_class: false, is_break: true },
          { name: 'Period 10', start_time: '15:40', end_time: '16:20', is_class: true },
          { name: 'Period 11', start_time: '16:20', end_time: '17:00', is_class: true },
          { name: 'Sports & Activities', start_time: '17:00', end_time: '18:30', is_class: false, is_activity: true },
          { name: 'Evening Self Study', start_time: '18:30', end_time: '20:30', is_class: false, is_activity: true },
          { name: 'Supper & Hygiene', start_time: '20:30', end_time: '21:30', is_class: false, is_break: true },
          { name: 'Sleep Time', start_time: '21:30', end_time: '05:00', is_class: false, is_break: true }
        ]
      },
      {
        name: 'Regular Day',
        day_of_week: 2, // Tuesday
        periods: [
            { name: 'Morning Self Study', start_time: '05:00', end_time: '07:00', is_class: false, is_activity: true },
          { name: 'Breakfast', start_time: '07:00', end_time: '07:30', is_class: false, is_break: true },
          { name: 'Period 1', start_time: '08:10', end_time: '08:50', is_class: true },
          { name: 'Period 2', start_time: '08:50', end_time: '09:30', is_class: true },
          { name: 'Period 3', start_time: '09:30', end_time: '10:10', is_class: true },
          { name: 'Break', start_time: '10:10', end_time: '10:25', is_class: false, is_break: true },
          { name: 'Period 4', start_time: '10:25', end_time: '11:05', is_class: true },
          { name: 'Period 5', start_time: '11:05', end_time: '11:45', is_class: true },
          { name: 'Period 6', start_time: '11:45', end_time: '12:25', is_class: true },
          { name: 'Lunch', start_time: '12:25', end_time: '13:30', is_class: false, is_break: true },
          { name: 'Period 7', start_time: '13:30', end_time: '14:10', is_class: true },
          { name: 'Period 8', start_time: '14:10', end_time: '14:50', is_class: true },
          { name: 'Period 9', start_time: '14:50', end_time: '15:30', is_class: true },
          { name: 'Break', start_time: '15:30', end_time: '15:40', is_class: false, is_break: true },
          { name: 'Period 10', start_time: '15:40', end_time: '16:20', is_class: true },
          { name: 'Period 11', start_time: '16:20', end_time: '17:00', is_class: true },
          { name: 'Sports & Activities', start_time: '17:00', end_time: '18:30', is_class: false, is_activity: true },
          { name: 'Evening Self Study', start_time: '18:30', end_time: '20:30', is_class: false, is_activity: true },
          { name: 'Supper & Hygiene', start_time: '20:30', end_time: '21:30', is_class: false, is_break: true },
          { name: 'Sleep Time', start_time: '21:30', end_time: '05:00', is_class: false, is_break: true }
        ]
      },
      {
        name: 'Assembly Day',
        day_of_week: 3, // Wednesday
        periods: [
          { name: 'Morning Self Study', start_time: '05:00', end_time: '07:00', is_class: false, is_activity: true },
          { name: 'Breakfast', start_time: '07:00', end_time: '07:30', is_class: false, is_break: true },
          { name: 'Assembly', start_time: '07:45', end_time: '08:10', is_class: false, is_activity: true },
          { name: 'Period 1', start_time: '08:10', end_time: '08:50', is_class: true },
          { name: 'Period 2', start_time: '08:50', end_time: '09:30', is_class: true },
          { name: 'Period 3', start_time: '09:30', end_time: '10:10', is_class: true },
          { name: 'Break', start_time: '10:10', end_time: '10:25', is_class: false, is_break: true },
          { name: 'Period 4', start_time: '10:25', end_time: '11:05', is_class: true },
          { name: 'Period 5', start_time: '11:05', end_time: '11:45', is_class: true },
          { name: 'Period 6', start_time: '11:45', end_time: '12:25', is_class: true },
          { name: 'Lunch', start_time: '12:25', end_time: '13:30', is_class: false, is_break: true },
          { name: 'Period 7', start_time: '13:30', end_time: '14:10', is_class: true },
          { name: 'Period 8', start_time: '14:10', end_time: '14:50', is_class: true },
          { name: 'Period 9', start_time: '14:50', end_time: '15:30', is_class: true },
          { name: 'Break', start_time: '15:30', end_time: '15:40', is_class: false, is_break: true },
          { name: 'Period 10', start_time: '15:40', end_time: '16:20', is_class: true },
          { name: 'Period 11', start_time: '16:20', end_time: '17:00', is_class: true },
          { name: 'Sports & Activities', start_time: '17:00', end_time: '18:30', is_class: false, is_activity: true },
          { name: 'Evening Self Study', start_time: '18:30', end_time: '20:30', is_class: false, is_activity: true },
          { name: 'Supper & Hygiene', start_time: '20:30', end_time: '21:30', is_class: false, is_break: true },
          { name: 'Sleep Time', start_time: '21:30', end_time: '05:00', is_class: false, is_break: true }
        ]
      },
      {
        name: 'Regular Day',
        day_of_week: 4, // Thursday
        periods: [
          { name: 'Morning Self Study', start_time: '05:00', end_time: '07:00', is_class: false, is_activity: true },
          { name: 'Breakfast', start_time: '07:00', end_time: '07:20', is_class: false, is_break: true },
          { name: 'Period 1', start_time: '08:10', end_time: '08:50', is_class: true },
          { name: 'Period 2', start_time: '08:50', end_time: '09:30', is_class: true },
          { name: 'Period 3', start_time: '09:30', end_time: '10:10', is_class: true },
          { name: 'Break', start_time: '10:10', end_time: '10:25', is_class: false, is_break: true },
          { name: 'Period 4', start_time: '10:25', end_time: '11:05', is_class: true },
          { name: 'Period 5', start_time: '11:05', end_time: '11:45', is_class: true },
          { name: 'Period 6', start_time: '11:45', end_time: '12:25', is_class: true },
          { name: 'Lunch', start_time: '12:25', end_time: '13:30', is_class: false, is_break: true },
          { name: 'Period 7', start_time: '13:30', end_time: '14:10', is_class: true },
          { name: 'Period 8', start_time: '14:10', end_time: '14:50', is_class: true },
          { name: 'Period 9', start_time: '14:50', end_time: '15:30', is_class: true },
          { name: 'Break', start_time: '15:30', end_time: '15:40', is_class: false, is_break: true },
          { name: 'Period 10', start_time: '15:40', end_time: '16:20', is_class: true },
          { name: 'Period 11', start_time: '16:20', end_time: '17:00', is_class: true },
          { name: 'Sports & Activities', start_time: '17:00', end_time: '18:30', is_class: false, is_activity: true },
          { name: 'Evening Self Study', start_time: '18:30', end_time: '20:30', is_class: false, is_activity: true },
          { name: 'Supper & Hygiene', start_time: '20:30', end_time: '21:30', is_class: false, is_break: true },
          { name: 'Sleep Time', start_time: '21:30', end_time: '05:00', is_class: false, is_break: true }
        ]
      },
      {
        name: 'Regular Day',
        day_of_week: 5, // Friday
        periods: [
          { name: 'Morning Self Study', start_time: '05:00', end_time: '07:00', is_class: false, is_activity: true },
          { name: 'Breakfast', start_time: '07:00', end_time: '07:20', is_class: false, is_break: true },
          { name: 'Period 1', start_time: '08:10', end_time: '08:50', is_class: true },
          { name: 'Period 2', start_time: '08:50', end_time: '09:30', is_class: true },
          { name: 'Period 3', start_time: '09:30', end_time: '10:10', is_class: true },
          { name: 'Break', start_time: '10:10', end_time: '10:25', is_class: false, is_break: true },
          { name: 'Period 4', start_time: '10:25', end_time: '11:05', is_class: true },
          { name: 'Period 5', start_time: '11:05', end_time: '11:45', is_class: true },
          { name: 'Period 6', start_time: '11:45', end_time: '12:25', is_class: true },
          { name: 'Lunch', start_time: '12:25', end_time: '13:30', is_class: false, is_break: true },
          { name: 'Period 7', start_time: '13:30', end_time: '14:10', is_class: true },
          { name: 'Period 8', start_time: '14:10', end_time: '14:50', is_class: true },
          { name: 'Period 9', start_time: '14:50', end_time: '15:30', is_class: true },
          { name: 'Break', start_time: '15:30', end_time: '15:40', is_class: false, is_break: true },
          { name: 'Period 10', start_time: '15:40', end_time: '16:20', is_class: true },
          { name: 'Period 11', start_time: '16:20', end_time: '17:00', is_class: true },
          { name: 'Sports & Activities', start_time: '17:00', end_time: '18:30', is_class: false, is_activity: true },
          { name: 'Evening Self Study', start_time: '18:30', end_time: '20:30', is_class: false, is_activity: true },
          { name: 'Supper & Hygiene', start_time: '20:30', end_time: '21:30', is_class: false, is_break: true },
          { name: 'Sleep Time', start_time: '21:30', end_time: '05:00', is_class: false, is_break: true }
        ]
      },
      {
        name: 'Weekend',
        day_of_week: 6, // Saturday
        periods: [
          { name: 'Morning Sport', start_time: '05:30', end_time: '07:00', is_class: false, is_activity: true },
          { name: 'Breakfast', start_time: '07:00', end_time: '07:20', is_class: false, is_break: true },
          { name: 'Cleaning & Activities', start_time: '07:20', end_time: '12:00', is_class: false, is_activity: true },
          { name: 'Lunch', start_time: '12:00', end_time: '13:00', is_class: false, is_break: true },
          { name: 'Sports & Activities', start_time: '13:00', end_time: '17:00', is_class: false, is_activity: true },
          { name: 'Movie Time', start_time: '17:00', end_time: '20:30', is_class: false, is_activity: true },
          { name: 'Supper & Hygiene', start_time: '20:30', end_time: '21:30', is_class: false, is_break: true },
          { name: 'Sleep Time', start_time: '21:30', end_time: '05:00', is_class: false, is_break: true }
        ]
      },
      {
        name: 'Weekend',
        day_of_week: 7, // Sunday
        periods: [
          { name: 'Breakfast', start_time: '07:00', end_time: '07:20', is_class: false, is_break: true },
          { name: 'Self Study', start_time: '08:00', end_time: '10:45', is_class: false, is_activity: true },
          { name: 'Break', start_time: '10:45', end_time: '11:00', is_class: false, is_break: true },
          { name: 'Mass', start_time: '11:00', end_time: '13:00', is_class: false, is_break: true },

          { name: 'Lunch', start_time: '13:00', end_time: '13:30', is_class: false, is_break: true },
          { name: 'Sports & Activities', start_time: '13:00', end_time: '17:00', is_class: false, is_activity: true },
          { name: 'Evening Self Study', start_time: '18:30', end_time: '20:30', is_class: false, is_activity: true },
          { name: 'Supper & Hygiene', start_time: '20:30', end_time: '21:30', is_class: false, is_break: true },
          { name: 'Sleep Time', start_time: '21:30', end_time: '05:00', is_class: false, is_break: true }
        ]
      }
    ];
    
    await Schedule.insertMany(defaultSchedules);
    res.json({ message: 'Default schedule created successfully' });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
