const mongoose = require('mongoose');
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  class_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  hours_per_week: { type: Number, required: true, min: 1, default: 1 },
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

subjectSchema.index({ name: 1 }, { unique: true });
module.exports = mongoose.model('Subject', subjectSchema);
