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
const ClassSubject = require('../models/ClassSubject');
const TeacherSubject = require('../models/TeacherSubject');

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
    Schedule.deleteMany({}),
    ClassSubject.deleteMany({}),
    TeacherSubject.deleteMany({})
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
  const roomNames = ['S1A', 'S1B', 'S2A', 'S2B', 'S3A', 'S3B', 'S4A', 'S4B', 'S5 MCB', 'S5 PCB', 'S6 MCB', 'S6 PCB'];
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

  // Create Class-Subject assignments for S1A (Sample data for testing)
  // S1A gets: Math (5 hours), English (4 hours), French (3 hours), Kinyarwanda (2 hours), Biology (3 hours), Chemistry (3 hours)
  const s1a = classes[0]; // S1A
  const s2a = classes[2]; // S2A
  
  const mathSubject = subjects[0];
  const englishSubject = subjects[4];
  const frenchSubject = subjects[5];
  const kinyarwandaSubject = subjects[6];
  const biologySubject = subjects[3];
  const chemistrySubject = subjects[2];
  const historySubject = subjects[7];
  const computerSubject = subjects[10];

  // Assign subjects to S1A with hours per week
  await ClassSubject.insertMany([
    // S1A
    { class_id: s1a._id, subject_id: mathSubject._id, hours_per_week: 5, is_active: true },
    { class_id: s1a._id, subject_id: englishSubject._id, hours_per_week: 4, is_active: true },
    { class_id: s1a._id, subject_id: frenchSubject._id, hours_per_week: 3, is_active: true },
    { class_id: s1a._id, subject_id: kinyarwandaSubject._id, hours_per_week: 2, is_active: true },
    { class_id: s1a._id, subject_id: biologySubject._id, hours_per_week: 3, is_active: true },
    { class_id: s1a._id, subject_id: chemistrySubject._id, hours_per_week: 3, is_active: true },
    { class_id: s1a._id, subject_id: historySubject._id, hours_per_week: 2, is_active: true },
    
    // S2A (sample)
    { class_id: s2a._id, subject_id: mathSubject._id, hours_per_week: 5, is_active: true },
    { class_id: s2a._id, subject_id: englishSubject._id, hours_per_week: 4, is_active: true },
    { class_id: s2a._id, subject_id: computerSubject._id, hours_per_week: 3, is_active: true }
  ]);

  // Assign teachers to subjects
  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10] = teachers;
  
  await TeacherSubject.insertMany([
    { teacher_id: t1._id, subject_id: mathSubject._id, is_active: true },
    { teacher_id: t2._id, subject_id: englishSubject._id, is_active: true },
    { teacher_id: t3._id, subject_id: frenchSubject._id, is_active: true },
    { teacher_id: t4._id, subject_id: kinyarwandaSubject._id, is_active: true },
    { teacher_id: t5._id, subject_id: biologySubject._id, is_active: true },
    { teacher_id: t6._id, subject_id: chemistrySubject._id, is_active: true },
    { teacher_id: t7._id, subject_id: historySubject._id, is_active: true },
    { teacher_id: t8._id, subject_id: computerSubject._id, is_active: true },
    { teacher_id: t9._id, subject_id: mathSubject._id, is_active: true },
    { teacher_id: t10._id, subject_id: englishSubject._id, is_active: true }
  ]);

  console.log('Database seeded successfully!');
  console.log('');
  console.log('✅ Sample Data Created:');
  console.log(`  • ${classes.length} Classes: ${classNames.slice(0, 3).join(', ')}, ...`);
  console.log(`  • ${subjects.length} Subjects: ${subjectNames.slice(0, 5).join(', ')}, ...`);
  console.log(`  • ${teachers.length} Teachers`);
  console.log(`  • ${classrooms.length} Classrooms`);
  console.log(`  • 10 Class-Subject Assignments (S1A and S2A)`);
  console.log(`  • 10 Teacher-Subject Assignments`);
  console.log(`  • Schedule configured for Monday-Friday with ${basePeriods.length} periods`);
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('  Admin: username=admin, password=admin123');
  console.log('  Headteacher: username=headteacher, password=muhura2026');
  console.log('');
  console.log('📅 Next step: Go to Admin > Manage Timetable and click "Auto Generate" button');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
