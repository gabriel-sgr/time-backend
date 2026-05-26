const mongoose = require('mongoose');

const classSubjectSchema = new mongoose.Schema({
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  hours_per_week: { type: Number, required: true, min: 1, default: 1 },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

classSubjectSchema.index({ class_id: 1, subject_id: 1 }, { unique: true });
module.exports = mongoose.model('ClassSubject', classSubjectSchema);
