const mongoose = require('mongoose');
const Class = require('./models/Class');
const Subject = require('./models/Subject');

async function updateActiveStatus() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/school-timetable');
    console.log('Connected to database');

    // Update all classes to have is_active: true if not set
    const classResult = await Class.updateMany(
      { is_active: { $exists: false } },
      { is_active: true }
    );
    console.log(`Updated ${classResult.modifiedCount} classes with is_active field`);

    // Update all subjects to have is_active: true if not set
    const subjectResult = await Subject.updateMany(
      { is_active: { $exists: false } },
      { is_active: true }
    );
    console.log(`Updated ${subjectResult.modifiedCount} subjects with is_active field`);
    
    console.log('Database update completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateActiveStatus();
