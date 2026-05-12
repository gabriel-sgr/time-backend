const express = require('express');
const Timetable = require('../models/Timetable');
const Schedule = require('../models/Schedule');
const { protect } = require('../middleware/auth');
const TimetableGenerator = require('../services/timetableGenerator');
const router = express.Router();

router.post('/auto-generate', protect, async (req, res) => {
  try {
    const generator = new TimetableGenerator();
    
    console.log('Step 1: Initializing timetable generator...');
    try {
      await generator.initialize();
    } catch (initError) {
      console.error('Initialization failed:', initError.message);
      return res.status(400).json({ 
        message: initError.message,
        step: 'initialization',
        hint: 'Please complete the setup checklist before generating timetables.'
      });
    }
    
    console.log('Step 2: Generating timetable...');
    const entries = await generator.generateTimetable();
    
    if (!entries || entries.length === 0) {
      console.warn('No timetable entries were generated');
      return res.status(400).json({ 
        message: 'Failed to generate timetable entries. The schedule may not have enough time slots or resources.',
        step: 'generation',
        possibleCauses: [
          'Not enough class periods in schedule',
          'Insufficient classrooms for all time slots',
          'Subjects require more hours than available time slots',
          'Some teachers/classrooms might be over-assigned'
        ],
        hint: 'Check the server logs for detailed generation information.'
      });
    }

    console.log('Step 3: Validating timetable...');
    const conflicts = await generator.validateTimetable();
    const stats = generator.getStatistics();
    
    console.log('Step 4: Fetching populated entries...');
    const populated = await Timetable.find()
      .populate('class_id', 'name')
      .populate('subject_id', 'name weekly_hours')
      .populate('teacher_id', 'name')
      .populate('classroom_id', 'name')
      .sort({ day_of_week: 1, start_time: 1 });
    
    const conflictMessage = conflicts.length === 0 
      ? '✅ No conflicts detected!'
      : `⚠️ ${conflicts.length} conflict(s) detected`;
    
    res.json({
      success: true,
      entries: populated,
      conflicts,
      statistics: stats,
      message: `✅ Generated ${entries.length} timetable entries. ${conflictMessage}`
    });
  } catch (err) {
    console.error('Timetable generation failed:', err);
    res.status(500).json({ 
      message: `Timetable generation failed: ${err.message}`,
      step: 'generation',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// GET all timetable entries (with populated references)
router.get('/', async (req, res) => {
  try {
    const entries = await Timetable.find()
      .populate('class_id', 'name')
      .populate('subject_id', 'name')
      .populate('teacher_id', 'name')
      .populate('classroom_id', 'name')
      .sort({ day_of_week: 1, start_time: 1 });
    res.json(entries);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/timetable/current-session — for user dashboard
router.get('/current-session', async (req, res) => {
  try {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon..7=Sun
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    // Get current period from TimePeriod model (added by admin)
    const TimePeriod = require('../models/TimePeriod');
    let currentPeriod = null;
    
    // Find period for current day or every day or mon-fri
    const periods = await TimePeriod.find({
      $or: [
        { day_of_week: currentDay },
        { day_of_week: 'every' },
        { day_of_week: (currentDay <= 5) ? 'mon-fri' : null }
      ],
      is_active: true
    });
    
    // Find the period that matches current time
    currentPeriod = periods.find(p => 
      currentTime >= p.start_time && currentTime < p.end_time
    );

    // Fallback to Schedule if no TimePeriod found
    if (!currentPeriod) {
      const schedule = await Schedule.findOne({ day_of_week: currentDay, is_active: true });
      if (schedule) {
        const schedulePeriod = schedule.periods.find(p => 
          currentTime >= p.start_time && currentTime < p.end_time
        );
        if (schedulePeriod) {
          currentPeriod = schedulePeriod;
        }
      }
    }

    // Only return sessions if there is a current period
    // This ensures sessions are only shown during admin-defined time periods
    let sessions = [];
    if (currentPeriod) {
      // Get regular sessions for today's day of week
      const regularSessions = await Timetable.find({
        day_of_week: currentDay,
        start_time: { $lte: currentTime },
        end_time: { $gt: currentTime },
        is_temporary: false
      })
        .populate('class_id', 'name')
        .populate('subject_id', 'name')
        .populate('teacher_id', 'name')
        .populate('classroom_id', 'name');

      // Get temporary sessions for today
      const tempSessions = await Timetable.find({
        is_temporary: true,
        temporary_date: { $gte: todayStart, $lt: todayEnd },
        start_time: { $lte: currentTime },
        end_time: { $gt: currentTime }
      })
        .populate('class_id', 'name')
        .populate('subject_id', 'name')
        .populate('teacher_id', 'name')
        .populate('classroom_id', 'name');

      // Temporary sessions override regular ones for the same class
      const tempClassIds = new Set(tempSessions.map(s => s.class_id._id.toString()));
      const filtered = regularSessions.filter(s => !tempClassIds.has(s.class_id._id.toString()));
      const allSessions = [...filtered, ...tempSessions];

      sessions = allSessions.map(s => ({
        _id: s._id,
        class_name: s.class_id.name,
        subject_name: s.subject_id.name,
        teacher_name: s.teacher_id.name,
        classroom_name: s.classroom_id.name,
        start_time: s.start_time,
        end_time: s.end_time,
        is_temporary: s.is_temporary
      }));
    }

    res.json({
      current_time: currentTime,
      current_day: currentDay,
      day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay],
      current_period: currentPeriod ? {
        name: currentPeriod.name,
        start_time: currentPeriod.start_time,
        end_time: currentPeriod.end_time
      } : null,
      sessions: sessions
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/timetable/current-sessions — for display screens
router.get('/current-sessions', async (req, res) => {
  try {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon..7=Sun
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    // Get current period from TimePeriod model (added by admin)
    const TimePeriod = require('../models/TimePeriod');
    let currentPeriod = null;
    
    // Find period for current day or every day or mon-fri
    const periods = await TimePeriod.find({
      $or: [
        { day_of_week: currentDay },
        { day_of_week: 'every' },
        { day_of_week: (currentDay <= 5) ? 'mon-fri' : null }
      ],
      is_active: true
    });
    
    // Find the period that matches current time
    currentPeriod = periods.find(p => 
      currentTime >= p.start_time && currentTime < p.end_time
    );

    // Fallback to Schedule if no TimePeriod found
    if (!currentPeriod) {
      const schedule = await Schedule.findOne({ day_of_week: currentDay, is_active: true });
      if (schedule) {
        const schedulePeriod = schedule.periods.find(p => 
          currentTime >= p.start_time && currentTime < p.end_time
        );
        if (schedulePeriod) {
          currentPeriod = schedulePeriod;
        }
      }
    }

    // Only return sessions if there is a current period
    // This ensures sessions are only shown during admin-defined time periods
    if (!currentPeriod) {
      return res.json([]);
    }

    // Get regular sessions for today's day of week, only for active classes and subjects
    const regularSessions = await Timetable.find({
      day_of_week: currentDay,
      start_time: { $lte: currentTime },
      end_time: { $gt: currentTime },
      is_temporary: false
    })
      .populate({
        path: 'class_id',
        match: { is_active: true },
        select: 'name'
      })
      .populate({
        path: 'subject_id',
        match: { is_active: true },
        select: 'name'
      })
      .populate('teacher_id', 'name')
      .populate('classroom_id', 'name');

    // Get temporary sessions for today, only for active classes and subjects
    const tempSessions = await Timetable.find({
      is_temporary: true,
      temporary_date: { $gte: todayStart, $lt: todayEnd },
      start_time: { $lte: currentTime },
      end_time: { $gt: currentTime }
    })
      .populate({
        path: 'class_id',
        match: { is_active: true },
        select: 'name'
      })
      .populate({
        path: 'subject_id',
        match: { is_active: true },
        select: 'name'
      })
      .populate('teacher_id', 'name')
      .populate('classroom_id', 'name');

    // Filter out sessions where class or subject is inactive (null after populate)
    const regularSessionsFiltered = regularSessions.filter(s => s.class_id && s.subject_id);
    const tempSessionsFiltered = tempSessions.filter(s => s.class_id && s.subject_id);

    // Temporary sessions override regular ones for the same class
    const tempClassIds = new Set(tempSessionsFiltered.map(s => s.class_id._id.toString()));
    const filtered = regularSessionsFiltered.filter(s => !tempClassIds.has(s.class_id._id.toString()));
    const allSessions = [...filtered, ...tempSessionsFiltered];

    const result = allSessions.map(s => ({
      _id: s._id,
      class_name: s.class_id.name,
      subject_name: s.subject_id.name,
      teacher_name: s.teacher_id.name,
      classroom_name: s.classroom_id.name,
      start_time: s.start_time,
      end_time: s.end_time,
      is_temporary: s.is_temporary
    }));

    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST
router.post('/', protect, async (req, res) => {
  try {
    const entry = await Timetable.create(req.body);
    const populated = await Timetable.findById(entry._id)
      .populate('class_id', 'name')
      .populate('subject_id', 'name')
      .populate('teacher_id', 'name')
      .populate('classroom_id', 'name');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT
router.put('/:id', protect, async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('class_id', 'name')
      .populate('subject_id', 'name')
      .populate('teacher_id', 'name')
      .populate('classroom_id', 'name');
    if (!entry) return res.status(404).json({ message: 'Not found' });
    res.json(entry);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /validate - Validate timetable for conflicts
router.get('/validate', protect, async (req, res) => {
  try {
    const generator = new TimetableGenerator();
    await generator.initialize();
    const conflicts = await generator.validateTimetable();
    res.json({ conflicts });
  } catch (err) {
    console.error('Validation error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
