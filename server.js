require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['https://time-frontend.onrender.com', 'http://localhost:3006', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/class-subjects', require('./routes/classSubjects'));
app.use('/api/teacher-subjects', require('./routes/teacherSubjects'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/time-periods', require('./routes/timePeriods'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/settings', require('./routes/settings'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
