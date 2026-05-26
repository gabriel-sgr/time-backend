const mongoose = require('mongoose');

const teacherSubjectSchema = new mongoose.Schema({
  teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

teacherSubjectSchema.index({ teacher_id: 1, subject_id: 1 }, { unique: true });
module.exports = mongoose.model('TeacherSubject', teacherSubjectSchema);
