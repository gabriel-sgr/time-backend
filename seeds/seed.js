require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const Schedule = require('../models/Schedule');

const seed = async () => {
  await connectDB();
  
  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Class.deleteMany({}),
    Teacher.deleteMany({}),
    Classroom.deleteMany({}),
    Subject.deleteMany({}),
    Timetable.deleteMany({}),
    Schedule.deleteMany({})
  ]);

  // Create admin account
  await User.create({
    username: 'admin',
    password: 'admin123',
    fullName: 'Administrator',
    role: 'admin'
  });

  // Create headteacher account
  await User.create({
    username: 'headteacher',
    password: 'muhura2026',
    fullName: 'Head Teacher',
    role: 'headteacher'
  });

  // Create classes
  const classNames = ['S1A', 'S1B', 'S2A', 'S2B', 'S3A', 'S3B', 'S4A', 'S4B', 'S5 MCB', 'S5 PCB', 'S6 MCB', 'S6 PCB'];
  const classes = await Class.insertMany(classNames.map(name => ({ name })));

  // Create subjects
  const subjectNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'French', 'Kinyarwanda', 'History', 'Geography', 'Entrepreneurship', 'Computer Science', 'Religion', 'Morning Self Study', 'Evening Self Study'];
  const subjects = await Subject.insertMany(subjectNames.map(name => ({ name })));

  // Create teachers
  const teacherNames = ['Mr. Niyonzima Jean', 'Mrs. Uwimana Marie', 'Mr. Habimana Pierre', 'Mrs. Mukamana Grace', 'Mr. Ndayisaba Eric', 'Mrs. Ingabire Claire', 'Mr. Mugisha David', 'Mrs. Nyirahabimana Alice', 'Mr. Bizimungu Frank', 'Mrs. Umubyeyi Diane'];
  const teachers = await Teacher.insertMany(teacherNames.map(name => ({ name })));

  // Create classrooms
  const roomNames = ['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Room 6', 'Room 7', 'Room 8', 'Science Lab 1', 'Science Lab 2', 'Computer Lab', 'Library'];
  const classrooms = await Classroom.insertMany(roomNames.map(name => ({ name })));

  // Create schedules for Monday to Friday with new time periods
  const basePeriods = [
    { name: 'Morning Class 1', start_time: '08:10', end_time: '08:50', is_class: true, is_break: false },
    { name: 'Morning Class 2', start_time: '08:50', end_time: '09:30', is_class: true, is_break: false },
    { name: 'Morning Class 3', start_time: '09:30', end_time: '10:10', is_class: true, is_break: false },
    { name: 'Morning Break', start_time: '10:10', end_time: '10:25', is_class: false, is_break: true },
    { name: 'Mid-Morning Class 1', start_time: '10:25', end_time: '11:05', is_class: true, is_break: false },
    { name: 'Mid-Morning Class 2', start_time: '11:05', end_time: '11:55', is_class: true, is_break: false },
    { name: 'Pre-Lunch Class', start_time: '11:55', end_time: '12:25', is_class: true, is_break: false },
    { name: 'Lunch Break', start_time: '12:25', end_time: '13:30', is_class: false, is_break: true },
    { name: 'Afternoon Class 1', start_time: '13:30', end_time: '14:10', is_class: true, is_break: false },
    { name: 'Afternoon Class 2', start_time: '14:10', end_time: '14:50', is_class: true, is_break: false },
    { name: 'Afternoon Class 3', start_time: '14:50', end_time: '15:30', is_class: true, is_break: false },
    { name: 'Afternoon Break', start_time: '15:30', end_time: '15:40', is_class: false, is_break: true },
    { name: 'Late Afternoon Class 1', start_time: '15:40', end_time: '16:20', is_class: true, is_break: false },
    { name: 'Late Afternoon Class 2', start_time: '16:20', end_time: '17:00', is_class: true, is_break: false }
  ];

  for (let day = 1; day <= 5; day++) {
    const periods = [];
    
    // Add assembly only on Monday at 7:50-8:10
    if (day === 1) {
      periods.push({ name: 'Assembly', start_time: '07:50', end_time: '08:10', is_class: false, is_break: false, is_activity: true });
    }
    
    // Add all base periods
    periods.push(...basePeriods);
    
    // Remove Period 11 on Wednesday (gap at 16:20-17:00)
    if (day === 3) {
      periods.pop(); // Remove last period
    }
    
    await Schedule.create({
      name: `Day ${day}`,
      day_of_week: day,
      periods: periods,
      is_active: true
    });
  }

  // Note: Timetable will be generated using the auto-generate feature

  console.log('Database seeded successfully!');
  console.log('Login credentials:');
  console.log('  Admin: username=admin, password=admin123');
  console.log('  Headteacher: username=headteacher, password=muhura2026');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
