const mongoose = require('mongoose');
const announcementSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  type: { type: String, enum: ['text', 'image', 'video'], default: 'image' },
  content: { type: String, default: '' }, // For text announcements
  fontSize: { type: Number, default: 24 }, // Font size for text announcements (in pixels)
  image_path: { type: String, default: '' }, // For image announcements
  video_path: { type: String, default: '' }, // For video announcements
  expires_at: { type: Date, default: null }
}, { timestamps: true });
module.exports = mongoose.model('Announcement', announcementSchema);
