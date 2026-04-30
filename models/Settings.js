const mongoose = require('mongoose');

const freeTimeSchema = new mongoose.Schema({
  day_of_week: { type: Number, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  label: { type: String, default: 'Free Time' }
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  logo_path: { type: String, default: '' },
  school_name: { type: String, default: 'LYCEE SAINT ALEXANDRE SAULI DE MUHURA' },
  assembly_day: { type: Number, default: 1 },
  assembly_start_time: { type: String, default: '07:50' },
  assembly_end_time: { type: String, default: '08:10' },
  free_times: [freeTimeSchema]
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
