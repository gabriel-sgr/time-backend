const mongoose = require('mongoose');
const timetableSchema = new mongoose.Schema({
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  classroom_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  day_of_week: { type: Number, required: true, min: 1, max: 7 }, // 1=Monday...7=Sunday
  start_time: { type: String, required: true }, // "HH:MM" format
  end_time: { type: String, required: true },
  is_temporary: { type: Boolean, default: false },
  temporary_date: { type: Date, default: null }
}, { timestamps: true });

timetableSchema.index({ start_time: 1, end_time: 1 });
timetableSchema.index({ day_of_week: 1 });
module.exports = mongoose.model('Timetable', timetableSchema);
