const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  class_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  all_classes: { type: Boolean, default: false },
  is_special: { type: Boolean, default: false },
  day_of_week: { type: Number, required: true, min: 1, max: 7 },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  time_period_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TimePeriod' },
  location: { type: String, trim: true },
  responsible_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
}, { timestamps: true });

activitySchema.index({ class_id: 1, day_of_week: 1 });
activitySchema.index({ class_ids: 1 });
activitySchema.index({ is_special: 1, all_classes: 1 });
activitySchema.index({ time_period_id: 1 });
module.exports = mongoose.model('Activity', activitySchema);
