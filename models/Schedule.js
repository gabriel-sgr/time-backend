const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  periods: [{
    name: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    is_class: { type: Boolean, default: true },
    is_break: { type: Boolean, default: false },
    is_activity: { type: Boolean, default: false }
  }],
  day_of_week: { type: Number, required: true, min: 1, max: 7 },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

scheduleSchema.index({ day_of_week: 1, 'periods.start_time': 1 });
module.exports = mongoose.model('Schedule', scheduleSchema);
