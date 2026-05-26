const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Schedule = require('../models/Schedule');
const ClassSubject = require('../models/ClassSubject');
const TeacherSubject = require('../models/TeacherSubject');

class TimetableGenerator {
  constructor() {
    this.classes = [];
    this.subjects = [];
    this.teachers = [];
    this.classrooms = [];
    this.schedules = [];
    this.conflicts = [];
    this.classSubjectMap = new Map();
    this.teacherSubjectMap = new Map();
    this.HOUR_DURATION = 40;

    // In-memory tracking to avoid race conditions with DB queries
    this.teacherSlots = new Map();    // "teacherId-day-period" -> true
    this.classroomSlots = new Map();  // "classroomId-day-period" -> true
  }

  async initialize() {
    try {
      // Find all classes, including those without is_active field (treat as active)
      this.classes = await Class.find({
        $or: [
          { is_active: true },
          { is_active: { $exists: false } }
        ]
      });
      
      // Find all subjects, including those without is_active field (treat as active)
      this.subjects = await Subject.find({
        $or: [
          { is_active: true },
          { is_active: { $exists: false } }
        ]
      }).populate('class_ids');
      
      this.teachers = await Teacher.find().populate('subject_ids');
      this.classrooms = await Classroom.find();
      this.schedules = await Schedule.find({ day_of_week: { $in: [1, 2, 3, 4, 5] } });

      // Validate basic requirements
      if (!this.classes || this.classes.length === 0) {
        throw new Error('No classes found in database. Please create classes first.');
      }
      if (!this.classrooms || this.classrooms.length === 0) {
        throw new Error('No classrooms found in database. Please create classrooms first.');
      }
      if (!this.teachers || this.teachers.length === 0) {
        throw new Error('No teachers found in database. Please create teachers first.');
      }
      if (!this.schedules || this.schedules.length === 0) {
        throw new Error('No schedule configured for weekdays (Mon-Fri). Please create a schedule first in the Schedule Management section.');
      }

      // Check if schedules have class periods
      const classPeriodsCount = this.schedules.reduce((sum, s) => {
        return sum + (s.periods ? s.periods.filter(p => p.is_class).length : 0);
      }, 0);
      if (classPeriodsCount === 0) {
        throw new Error('No class periods found in schedule. Please configure time periods for classes.');
      }

      const classSubjects = await ClassSubject.find({ is_active: true })
        .populate({
          path: 'class_id',
          match: {
            $or: [
              { is_active: true },
              { is_active: { $exists: false } }
            ]
          },
          select: 'name'
        })
        .populate({
          path: 'subject_id',
          match: {
            $or: [
              { is_active: true },
              { is_active: { $exists: false } }
            ]
          },
          select: 'name hours_per_week'
        });

      if (!classSubjects || classSubjects.length === 0) {
        throw new Error('No class-subject assignments found. Please assign subjects to classes first.');
      }

      this.classSubjectMap.clear();
      classSubjects.forEach(cs => {
        // Skip if class or subject is inactive (null after populate with match)
        if (!cs.class_id || !cs.subject_id) return;
        const classId = cs.class_id._id.toString();
        if (!this.classSubjectMap.has(classId)) {
          this.classSubjectMap.set(classId, []);
        }
        this.classSubjectMap.get(classId).push({
          subject_id: cs.subject_id._id.toString(),
          subject_name: cs.subject_id.name,
          hours_per_week: cs.hours_per_week,
          classSubjectId: cs._id.toString()
        });
      });

      const teacherSubjects = await TeacherSubject.find({ is_active: true })
        .populate('teacher_id', 'name email')
        .populate({
          path: 'subject_id',
          match: {
            $or: [
              { is_active: true },
              { is_active: { $exists: false } }
            ]
          },
          select: 'name hours_per_week'
        });

      if (!teacherSubjects || teacherSubjects.length === 0) {
        throw new Error('No teacher-subject assignments found. Please assign subjects to teachers first.');
      }

      this.teacherSubjectMap.clear();
      teacherSubjects.forEach(ts => {
        // Skip if subject is inactive (null after populate with match)
        if (!ts.teacher_id || !ts.subject_id) return;
        const subjectId = ts.subject_id._id.toString();
        if (!this.teacherSubjectMap.has(subjectId)) {
          this.teacherSubjectMap.set(subjectId, []);
        }
        this.teacherSubjectMap.get(subjectId).push({
          teacher_id: ts.teacher_id._id.toString(),
          teacher_name: ts.teacher_id.name,
          teacher_email: ts.teacher_id.email
        });
      });

      // Validate data completeness
      const unassignedClasses = this.classes.filter(
        c => !this.classSubjectMap.has(c._id.toString()) ||
             this.classSubjectMap.get(c._id.toString()).length === 0
      );
      if (unassignedClasses.length > 0) {
        console.warn(`⚠️ ${unassignedClasses.length} classes have no subjects assigned: ${unassignedClasses.map(c => c.name).join(', ')}`);
      }

      const subjectsWithoutTeachers = new Set();
      for (const [, subjects] of this.classSubjectMap) {
        for (const s of subjects) {
          if (!this.teacherSubjectMap.has(s.subject_id) ||
              this.teacherSubjectMap.get(s.subject_id).length === 0) {
            subjectsWithoutTeachers.add(s.subject_name);
          }
        }
      }
      if (subjectsWithoutTeachers.size > 0) {
        throw new Error(`Subjects without teachers assigned: ${[...subjectsWithoutTeachers].join(', ')}`);
      }

      console.log(`✅ Loaded: ${this.classes.length} classes, ${this.subjects.length} subjects, ${this.teachers.length} teachers, ${this.classrooms.length} classrooms, ${classSubjects.length} class-subject assignments, ${teacherSubjects.length} teacher-subject assignments, ${this.schedules.length} schedule(s)`);
    } catch (error) {
      throw new Error(`Failed to initialize timetable generator: ${error.message}`);
    }
  }

  async clearExistingTimetable() {
    try {
      await Timetable.deleteMany({});
      this.teacherSlots.clear();
      this.classroomSlots.clear();
      console.log('Cleared existing timetable');
    } catch (error) {
      throw new Error(`Failed to clear timetable: ${error.message}`);
    }
  }

  getClassPeriods(dayOfWeek) {
    const daySchedule = this.schedules.find(s => s.day_of_week === dayOfWeek);
    if (!daySchedule) return [];
    return daySchedule.periods.filter(period => period.is_class);
  }

  getSubjectsForClass(classId) {
    return this.classSubjectMap.get(classId.toString()) || [];
  }

  getTeachersForSubject(subjectId) {
    const subjectIdStr = subjectId.toString();
    const teacherAssignments = this.teacherSubjectMap.get(subjectIdStr) || [];
    return teacherAssignments.map(ta => ({
      _id: ta.teacher_id,
      name: ta.teacher_name,
      email: ta.teacher_email
    }));
  }

  // Slot key for in-memory tracking
  _slotKey(id, day, startTime, type = 'resource') {
    return `${type}:${id}:${day}:${startTime}`;
  }

  isTeacherAvailableInMemory(teacherId, dayOfWeek, startTime) {
    const key = this._slotKey(teacherId, dayOfWeek, startTime, 'teacher');
    return !this.teacherSlots.has(key);
  }

  isClassroomAvailableInMemory(classroomId, dayOfWeek, startTime) {
    const key = this._slotKey(classroomId, dayOfWeek, startTime, 'classroom');
    return !this.classroomSlots.has(key);
  }

  bookSlot(teacherId, classroomId, dayOfWeek, startTime) {
    const teacherKey = this._slotKey(teacherId, dayOfWeek, startTime, 'teacher');
    const classroomKey = this._slotKey(classroomId, dayOfWeek, startTime, 'classroom');
    this.teacherSlots.set(teacherKey, true);
    this.classroomSlots.set(classroomKey, true);
  }

  findAvailableClassroomInMemory(dayOfWeek, startTime, className = null) {
    // First, try to find a classroom matching the class name
    if (className) {
      const matchingClassroom = this.classrooms.find(c => c.name === className);
      if (matchingClassroom && this.isClassroomAvailableInMemory(matchingClassroom._id.toString(), dayOfWeek, startTime)) {
        return matchingClassroom;
      }
    }
    
    // Fallback to finding any available classroom
    for (const classroom of this.classrooms) {
      if (this.isClassroomAvailableInMemory(classroom._id.toString(), dayOfWeek, startTime)) {
        return classroom;
      }
    }
    return null;
  }

  findAvailableTeacherForSubjectInMemory(subjectId, dayOfWeek, startTime) {
    const teachers = this.getTeachersForSubject(subjectId);
    for (const teacher of teachers) {
      if (this.isTeacherAvailableInMemory(teacher._id.toString(), dayOfWeek, startTime)) {
        return teacher;
      }
    }
    return null;
  }

  async generateTimetable() {
    await this.clearExistingTimetable();

    const entries = [];
    // Track how many hours each subject has been assigned per class
    const classEntryCounts = new Map(); // classId -> Map(subjectId -> count)

    for (const cls of this.classes) {
      const subjectCounts = new Map();
      const classSubjects = this.getSubjectsForClass(cls._id.toString());
      for (const cs of classSubjects) {
        subjectCounts.set(cs.subject_id, 0); // Initialize all subjects to 0
      }
      classEntryCounts.set(cls._id.toString(), subjectCounts);
    }

    // Process day by day, period by period
    for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
      const periods = this.getClassPeriods(dayOfWeek);

      if (periods.length === 0) {
        console.warn(`No class periods found for day ${dayOfWeek}`);
        continue;
      }

      for (const period of periods) {
        // Shuffle classes to avoid bias (first class always gets best teachers)
        const shuffledClasses = [...this.classes].sort(() => Math.random() - 0.5);

        for (const cls of shuffledClasses) {
          const classId = cls._id.toString();
          const classSubjects = this.getSubjectsForClass(classId);

          if (classSubjects.length === 0) continue;

          const subjectCounts = classEntryCounts.get(classId);
          if (!subjectCounts) {
            console.error(`No subject counts map for class ${classId}`);
            continue;
          }

          // Get subjects that still need hours, sorted by MOST remaining first
          // This ensures subjects with more weekly hours get priority
          const availableSubjects = classSubjects
            .map(cs => ({
              ...cs,
              assigned: subjectCounts.get(cs.subject_id) || 0,
              remaining: cs.hours_per_week - (subjectCounts.get(cs.subject_id) || 0)
            }))
            .filter(cs => cs.remaining > 0)
            .sort((a, b) => b.remaining - a.remaining); // Most remaining first

          if (availableSubjects.length === 0) continue;

          let placed = false;

          // Try each subject in priority order until one can be placed
          for (const subjectData of availableSubjects) {
            const subjectId = subjectData.subject_id;

            // Find available teacher (in-memory check - no race conditions)
            const teacher = this.findAvailableTeacherForSubjectInMemory(
              subjectId, dayOfWeek, period.start_time
            );
            if (!teacher) {
              console.debug(`No teacher available for subject ${subjectId} on day ${dayOfWeek} at ${period.start_time}`);
              continue;
            }

            // Find available classroom (matching class name)
            const classroom = this.findAvailableClassroomInMemory(
              dayOfWeek, period.start_time, cls.name
            );
            if (!classroom) {
              console.debug(`No available classroom on day ${dayOfWeek} at ${period.start_time}`);
              continue; // Try next subject if classroom unavailable
            }

            // Book the slot in memory immediately
            this.bookSlot(
              teacher._id.toString(),
              classroom._id.toString(),
              dayOfWeek,
              period.start_time
            );

            // Create DB entry
            try {
              const entry = await Timetable.create({
                class_id: classId,
                subject_id: subjectId,
                teacher_id: teacher._id,
                classroom_id: classroom._id,
                day_of_week: dayOfWeek,
                start_time: period.start_time,
                end_time: period.end_time
              });

              entries.push(entry);
              // Properly increment the count for this subject in this class
              const currentCount = subjectCounts.get(subjectId) || 0;
              subjectCounts.set(subjectId, currentCount + 1);
              placed = true;
              break; // Move to next class after successful placement
            } catch (error) {
              console.error(`Failed to create timetable entry for ${cls.name}: ${error.message}`);
              // Release the booked slot if entry creation failed
              this.teacherSlots.delete(this._slotKey(teacher._id.toString(), dayOfWeek, period.start_time, 'teacher'));
              this.classroomSlots.delete(this._slotKey(classroom._id.toString(), dayOfWeek, period.start_time, 'classroom'));
            }
          }

          if (!placed && availableSubjects.length > 0) {
            console.debug(`Could not place any subject for ${cls.name} on day ${dayOfWeek} at ${period.name}`);
          }
        }
      }
    }

    // Report unmet hours
    for (const cls of this.classes) {
      const classId = cls._id.toString();
      const subjectCounts = classEntryCounts.get(classId);
      const classSubjects = this.getSubjectsForClass(classId);
      
      for (const cs of classSubjects) {
        const assigned = subjectCounts ? subjectCounts.get(cs.subject_id) || 0 : 0;
        if (assigned < cs.hours_per_week) {
          console.warn(`⚠️ ${cls.name}: ${cs.subject_name} got ${assigned}/${cs.hours_per_week} hours`);
        } else if (assigned === cs.hours_per_week) {
          console.log(`✅ ${cls.name}: ${cs.subject_name} completed ${assigned}/${cs.hours_per_week} hours`);
        }
      }
    }

    console.log(`✅ Generated ${entries.length} timetable entries`);
    return entries;
  }

  async validateTimetable() {
    const conflicts = [];
    const entries = await Timetable.find()
      .populate('class_id', 'name')
      .populate('subject_id', 'name')
      .populate('teacher_id', 'name')
      .populate('classroom_id', 'name');

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const e1 = entries[i];
        const e2 = entries[j];

        if (e1.day_of_week !== e2.day_of_week) continue;
        if (!this.timeOverlaps(e1.start_time, e1.end_time, e2.start_time, e2.end_time)) continue;

        // Teacher conflict
        if (e1.teacher_id._id.toString() === e2.teacher_id._id.toString()) {
          conflicts.push({
            type: 'teacher_conflict',
            teacher: e1.teacher_id.name,
            day: e1.day_of_week,
            time: `${e1.start_time}-${e1.end_time}`,
            class1: e1.class_id.name,
            class2: e2.class_id.name
          });
        }

        // Classroom conflict
        if (e1.classroom_id._id.toString() === e2.classroom_id._id.toString()) {
          conflicts.push({
            type: 'classroom_conflict',
            classroom: e1.classroom_id.name,
            day: e1.day_of_week,
            time: `${e1.start_time}-${e1.end_time}`,
            class1: e1.class_id.name,
            class2: e2.class_id.name
          });
        }

        // Same class, same time slot (should never happen)
        if (e1.class_id._id.toString() === e2.class_id._id.toString()) {
          conflicts.push({
            type: 'class_double_booking',
            class: e1.class_id.name,
            day: e1.day_of_week,
            time: `${e1.start_time}-${e1.end_time}`,
            subject1: e1.subject_id.name,
            subject2: e2.subject_id.name
          });
        }
      }
    }

    this.conflicts = conflicts;
    if (conflicts.length === 0) {
      console.log('✅ Timetable is valid — no conflicts found');
    } else {
      console.warn(`⚠️ Found ${conflicts.length} conflicts`);
      conflicts.forEach(c => console.warn(JSON.stringify(c)));
    }
    return conflicts;
  }

  timeOverlaps(start1, end1, start2, end2) {
    return start1 < end2 && start2 < end1;
  }

  getStatistics() {
    return {
      totalClasses: this.classes.length,
      totalSubjects: this.subjects.length,
      totalTeachers: this.teachers.length,
      totalClassrooms: this.classrooms.length,
      conflicts: this.conflicts.length
    };
  }
}

module.exports = TimetableGenerator;
