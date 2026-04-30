const mongoose = require('mongoose');

const timePeriodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  start_time: { type: String, required: true }, // Format: "08:00"
  end_time: { type: String, required: true },   // Format: "08:40"
  day_of_week: { type: [String, Number], required: true }, // Can be "mon-fri", "every", or 1-7
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

timePeriodSchema.index({ day_of_week: 1, start_time: 1 }, { unique: true });
module.exports = mongoose.model('TimePeriod', timePeriodSchema);
