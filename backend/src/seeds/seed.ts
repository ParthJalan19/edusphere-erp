import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

import User from '../models/user.model.js';
import Teacher from '../models/teacher.model.js';
import Student from '../models/student.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import AcademicYear from '../models/academicYear.model.js';
import Semester from '../models/semester.model.js';
import Department from '../models/department.model.js';
import Course from '../models/course.model.js';
import Subject from '../models/subject.model.js';
import Class from '../models/class.model.js';
import SemesterOffering from '../models/semesterOffering.model.js';
import Attendance from '../models/attendance.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import Note from '../models/notes.model.js';
import Result from '../models/result.model.js';
import Timetable from '../models/timetable.model.js';
import Notification from '../models/notification.model.js';

dotenv.config();

const teachersData = [
  {
    name: 'Dr. Sarah Jenkins',
    email: 'teacher1@edusphere.edu',
    employeeId: 'T1001',
    phone: '9876543210',
    designation: 'Professor & HOD',
  },
  {
    name: 'Dr. Alan Turing',
    email: 'teacher2@edusphere.edu',
    employeeId: 'T1002',
    phone: '9876543211',
    designation: 'Assistant Professor',
  },
  {
    name: 'Dr. Grace Hopper',
    email: 'teacher3@edusphere.edu',
    employeeId: 'T1003',
    phone: '9876543212',
    designation: 'Associate Professor',
  },
];

const studentsData = [
  {
    name: 'Alex Rivera',
    email: 'student1@edusphere.edu',
    rollNumber: 'S1001',
    phone: '8765432101',
  },
  {
    name: 'Emma Watson',
    email: 'student2@edusphere.edu',
    rollNumber: 'S1002',
    phone: '8765432102',
  },
  {
    name: 'Liam Neeson',
    email: 'student3@edusphere.edu',
    rollNumber: 'S1003',
    phone: '8765432103',
  },
  {
    name: 'Olivia Wilde',
    email: 'student4@edusphere.edu',
    rollNumber: 'S1004',
    phone: '8765432104',
  },
  {
    name: 'Noah Centineo',
    email: 'student5@edusphere.edu',
    rollNumber: 'S1005',
    phone: '8765432105',
  },
  {
    name: 'Sophia Loren',
    email: 'student6@edusphere.edu',
    rollNumber: 'S1006',
    phone: '8765432106',
  },
  { name: 'James Bond', email: 'student7@edusphere.edu', rollNumber: 'S1007', phone: '8765432107' },
  {
    name: 'Mia Khalifa',
    email: 'student8@edusphere.edu',
    rollNumber: 'S1008',
    phone: '8765432108',
  },
  {
    name: 'Lucas Hedges',
    email: 'student9@edusphere.edu',
    rollNumber: 'S1009',
    phone: '8765432109',
  },
  {
    name: 'Charlotte Gainsbourg',
    email: 'student10@edusphere.edu',
    rollNumber: 'S1010',
    phone: '8765432110',
  },
];

const seedDB = async () => {
  try {
    const databaseUri = process.env.MONGODB_URI;
    if (!databaseUri) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    console.log('Connecting to MongoDB database for seeding... 🔌');
    await mongoose.connect(databaseUri);
    console.log('Database connected successfully! 💾');

    // 1. Clear existing database collections
    console.log('Clearing existing collections... 🧹');
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await Student.deleteMany({});
    await RefreshToken.deleteMany({});
    await AcademicYear.deleteMany({});
    await Semester.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Subject.deleteMany({});
    await Class.deleteMany({});
    await SemesterOffering.deleteMany({});
    await Attendance.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Note.deleteMany({});
    await Result.deleteMany({});
    await Timetable.deleteMany({});
    await Notification.deleteMany({});

    const defaultPassword = 'Password123';

    // 2. Seed Academic Year & Semesters
    console.log('Seeding Academic Years & Semesters... 📅');
    const academicYear = await AcademicYear.create({
      name: '2026-2027',
      isActive: true,
    });

    const oddSemester = await Semester.create({
      name: '2026 Odd Semester',
      academicYear: academicYear._id,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-15'),
      status: 'active',
    });

    await Semester.create({
      name: '2027 Even Semester',
      academicYear: academicYear._id,
      startDate: new Date('2027-01-05'),
      endDate: new Date('2027-05-30'),
      status: 'upcoming',
    });

    // 3. Seed Departments
    console.log('Seeding Departments... 🏢');
    const cseDept = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      isActive: true,
    });

    const itDept = await Department.create({
      name: 'Information Technology',
      code: 'IT',
      isActive: true,
    });

    // 4. Seed Courses
    console.log('Seeding Courses... 🎓');
    const cseCourse = await Course.create({
      name: 'B.Tech Computer Science & Engineering',
      code: 'BTECH-CSE',
      department: cseDept._id,
      durationYears: 4,
    });

    const itCourse = await Course.create({
      name: 'B.Tech Information Technology',
      code: 'BTECH-IT',
      department: itDept._id,
      durationYears: 4,
    });

    // 5. Seed Subjects
    console.log('Seeding Subjects... 📚');
    const dbmsSub = await Subject.create({
      name: 'Database Management Systems',
      code: 'CS401',
      credits: 4,
      course: cseCourse._id,
      department: cseDept._id,
    });

    const seSub = await Subject.create({
      name: 'Software Engineering',
      code: 'CS402',
      credits: 3,
      course: cseCourse._id,
      department: cseDept._id,
    });

    const dsaSub = await Subject.create({
      name: 'Data Structures & Algorithms',
      code: 'CS201',
      credits: 4,
      course: cseCourse._id,
      department: cseDept._id,
    });

    const wtSub = await Subject.create({
      name: 'Web Technologies',
      code: 'IT401',
      credits: 3,
      course: itCourse._id,
      department: itDept._id,
    });

    // 6. Seed Classes
    console.log('Seeding Class Sections... 🏫');
    const cseClass = await Class.create({
      name: 'CSE Section A',
      course: cseCourse._id,
      batchYear: 2024,
    });

    const itClass = await Class.create({
      name: 'IT Section A',
      course: itCourse._id,
      batchYear: 2024,
    });

    // 7. Seed Teachers
    console.log('Seeding Teachers... 🧑‍🏫');
    const teachers: mongoose.Document[] = [];
    for (const t of teachersData) {
      const user = await User.create({
        email: t.email,
        password: defaultPassword,
        role: 'Teacher',
        isActive: true,
      });

      const profile = await Teacher.create({
        user: user._id,
        name: t.name,
        email: t.email,
        employeeId: t.employeeId,
        phone: t.phone,
        designation: t.designation,
        department: t.employeeId === 'T1003' ? itDept._id : cseDept._id,
        isActive: true,
      });
      teachers.push(profile);
    }

    const tJenkins = teachers[0] as any; // DBMS, DSA
    const tTuring = teachers[1] as any; // SE
    const tHopper = teachers[2] as any; // WT

    // 8. Seed Students
    console.log('Seeding Students... 🧑‍🎓');
    const students: mongoose.Document[] = [];
    for (const s of studentsData) {
      const user = await User.create({
        email: s.email,
        password: defaultPassword,
        role: 'Student',
        isActive: true,
      });

      const profile = await Student.create({
        user: user._id,
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
        phone: s.phone,
        department:
          s.rollNumber.startsWith('S100') && parseInt(s.rollNumber.substring(4), 10) <= 5
            ? cseDept._id
            : itDept._id,
        course:
          s.rollNumber.startsWith('S100') && parseInt(s.rollNumber.substring(4), 10) <= 5
            ? cseCourse._id
            : itCourse._id,
        isActive: true,
      });
      students.push(profile);
    }

    // Split student groups for CSE vs IT
    const cseStudents = students.slice(0, 5).map((s) => s._id); // Alex, Emma, Liam, Olivia, Noah
    const itStudents = students.slice(5).map((s) => s._id); // Sophia, James, Mia, Lucas, Charlotte

    // 9. Seed Semester Offerings (Intersection)
    console.log('Seeding Semester Offerings... 🔗');

    // Offering 1: DBMS (CSE Section A, Dr. Sarah Jenkins)
    const offeringDBMS = await SemesterOffering.create({
      semester: oddSemester._id,
      subject: dbmsSub._id,
      class: cseClass._id,
      teacher: tJenkins._id,
      students: cseStudents,
    });

    // Offering 2: Software Engineering (CSE Section A, Dr. Alan Turing)
    const offeringSE = await SemesterOffering.create({
      semester: oddSemester._id,
      subject: seSub._id,
      class: cseClass._id,
      teacher: tTuring._id,
      students: cseStudents,
    });

    // Offering 3: Data Structures (CSE Section A, Dr. Sarah Jenkins)
    const offeringDSA = await SemesterOffering.create({
      semester: oddSemester._id,
      subject: dsaSub._id,
      class: cseClass._id,
      teacher: tJenkins._id,
      students: cseStudents,
    });

    // Offering 4: Web Technologies (IT Section A, Dr. Grace Hopper)
    await SemesterOffering.create({
      semester: oddSemester._id,
      subject: wtSub._id,
      class: itClass._id,
      teacher: tHopper._id,
      students: itStudents,
    });

    // 10. Seed Attendance records (DBMS class - 4 days history)
    console.log('Seeding Attendance logs... 📝');
    const dates = [
      new Date('2026-07-06'),
      new Date('2026-07-07'),
      new Date('2026-07-08'),
      new Date('2026-07-09'),
    ];

    const attendanceStatuses: ('Present' | 'Absent' | 'Late' | 'Leave')[][] = [
      ['Present', 'Present', 'Present', 'Present', 'Absent'], // Day 1
      ['Present', 'Present', 'Late', 'Present', 'Present'], // Day 2
      ['Present', 'Absent', 'Present', 'Present', 'Present'], // Day 3
      ['Present', 'Present', 'Present', 'Leave', 'Present'], // Day 4
    ];

    for (let dayIdx = 0; dayIdx < dates.length; dayIdx++) {
      const date = dates[dayIdx];
      date.setUTCHours(0, 0, 0, 0);

      for (let sIdx = 0; sIdx < cseStudents.length; sIdx++) {
        const studentId = cseStudents[sIdx];
        const status = attendanceStatuses[dayIdx][sIdx];
        await Attendance.create({
          student: studentId,
          semesterOffering: offeringDBMS._id,
          date,
          status,
          remarks:
            status === 'Late' ? 'Late by 10 mins' : status === 'Leave' ? 'Medical leave' : '',
        });
      }
    }

    // 11. Seed Assignments
    console.log('Seeding Assignments... 📋');
    const assign1 = await Assignment.create({
      semesterOffering: offeringDBMS._id,
      title: 'Relational Algebra Exercise Sheet',
      description:
        'Solve operations for Join, Project, Select, Division. Submit hand-written scanning in PDF format.',
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000), // due in 5 days
      totalMarks: 50,
      fileAttachmentUrl: '/api/v1/files/download/mock-algebra.pdf',
      fileAttachmentName: 'relational_algebra_guide.pdf',
    });

    const assign2 = await Assignment.create({
      semesterOffering: offeringDBMS._id,
      title: 'Database Normalization Project',
      description:
        'Decompose the given universal schema into BCNF and 3NF. State functional dependencies and keys.',
      dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000), // past due (2 days ago)
      totalMarks: 100,
    });

    // 12. Seed Submission Versions (Student 1 has submitted Assign 1 and it is Graded; Student 2 has submitted Assign 1 but it remains Ungraded)
    console.log('Seeding Submission records... 📥');
    const sAlex = students[0] as any;
    const sEmma = students[1] as any;

    // Alex's Submission for Assignment 1 - version 1 graded
    await Submission.create({
      assignment: assign1._id,
      student: sAlex._id,
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          fileUrl: '/api/v1/files/download/alex_algebra_sub.pdf',
          fileName: 'alex_rivera_algebra_v1.pdf',
          submittedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          status: 'Graded',
          marksObtained: 46,
          feedback: 'Excellent work, very clean calculations!',
          gradedBy: tJenkins._id,
        },
      ],
    });

    // Alex's Submission for Assignment 2 - version 1 submitted late
    await Submission.create({
      assignment: assign2._id,
      student: sAlex._id,
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          fileUrl: '/api/v1/files/download/alex_normalization_sub.pdf',
          fileName: 'alex_rivera_normalization.pdf',
          submittedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000), // submitted 1 day ago (due was 2 days ago, so late)
          status: 'Late',
        },
      ],
    });

    // Emma's Submission for Assignment 1 - version 2 ungraded
    await Submission.create({
      assignment: assign1._id,
      student: sEmma._id,
      currentVersion: 2,
      versions: [
        {
          versionNumber: 1,
          fileUrl: '/api/v1/files/download/emma_algebra_draft.pdf',
          fileName: 'emma_algebra_draft.pdf',
          submittedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
          status: 'Submitted',
        },
        {
          versionNumber: 2,
          fileUrl: '/api/v1/files/download/emma_algebra_final.pdf',
          fileName: 'emma_algebra_final.pdf',
          submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          status: 'Submitted',
        },
      ],
    });

    // 13. Seed Notes
    console.log('Seeding Course Notes... 📖');
    await Note.create({
      semesterOffering: offeringDBMS._id,
      teacher: tJenkins._id,
      title: 'Introduction to SQL and Keys',
      fileUrl: '/api/v1/files/download/mock-sql-intro.pdf',
      fileName: '01_intro_to_sql.pdf',
    });

    await Note.create({
      semesterOffering: offeringDBMS._id,
      teacher: tJenkins._id,
      title: 'Normal Forms Cheatsheet (1NF - BCNF)',
      fileUrl: '/api/v1/files/download/mock-nf-cheatsheet.pdf',
      fileName: '02_normalization_cheatsheet.pdf',
    });

    // 14. Seed Course Results (Grade Sheet)
    console.log('Seeding results (published vs unpublished)... 🏆');

    // Published Results: DBMS offering (Sarah Jenkins) for all 5 CSE students
    const gradesDBMS = [
      { student: cseStudents[0], internal: 38, external: 55 }, // 93 = O
      { student: cseStudents[1], internal: 35, external: 51 }, // 86 = A+
      { student: cseStudents[2], internal: 32, external: 46 }, // 78 = A
      { student: cseStudents[3], internal: 28, external: 35 }, // 63 = B+
      { student: cseStudents[4], internal: 24, external: 31 }, // 55 = B
    ];

    for (const g of gradesDBMS) {
      const total = g.internal + g.external;
      let gp = 0;
      let gl: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' = 'F';

      if (total >= 90) {
        gp = 10;
        gl = 'O';
      } else if (total >= 80) {
        gp = 9;
        gl = 'A+';
      } else if (total >= 70) {
        gp = 8;
        gl = 'A';
      } else if (total >= 60) {
        gp = 7;
        gl = 'B+';
      } else if (total >= 50) {
        gp = 6;
        gl = 'B';
      } else if (total >= 45) {
        gp = 5;
        gl = 'C';
      } else if (total >= 40) {
        gp = 4;
        gl = 'P';
      }

      await Result.create({
        student: g.student,
        semesterOffering: offeringDBMS._id,
        internalMarks: g.internal,
        externalMarks: g.external,
        totalMarks: total,
        gradePoint: gp,
        gradeLetter: gl,
        isPublished: true, // DBMS results are published!
      });
    }

    // Unpublished Results: Software Engineering offering (Alan Turing) - marks written but not published
    for (let i = 0; i < cseStudents.length; i++) {
      const studentId = cseStudents[i];
      const total = 65 + i * 5; // 65, 70, 75, 80, 85
      let gp = 0;
      let gl: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' = 'F';

      if (total >= 90) {
        gp = 10;
        gl = 'O';
      } else if (total >= 80) {
        gp = 9;
        gl = 'A+';
      } else if (total >= 70) {
        gp = 8;
        gl = 'A';
      } else if (total >= 60) {
        gp = 7;
        gl = 'B+';
      }

      await Result.create({
        student: studentId,
        semesterOffering: offeringSE._id,
        internalMarks: 25,
        externalMarks: total - 25,
        totalMarks: total,
        gradePoint: gp,
        gradeLetter: gl,
        isPublished: false, // NOT published yet! Students won't see them!
      });
    }

    // 15. Seed Timetable
    console.log('Seeding Timetable schedules... 🗓️');

    // DBMS - Mon 9:00 - 10:30
    await Timetable.create({
      semesterOffering: offeringDBMS._id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '10:30',
      room: 'Room 301, Block A',
    });

    // Data Structures - Wed 11:00 - 12:30
    await Timetable.create({
      semesterOffering: offeringDSA._id,
      dayOfWeek: 3, // Wednesday
      startTime: '11:00',
      endTime: '12:30',
      room: 'Lab 2, CS block',
    });

    // Software Engineering - Tue 10:00 - 11:30
    await Timetable.create({
      semesterOffering: offeringSE._id,
      dayOfWeek: 2, // Tuesday
      startTime: '10:00',
      endTime: '11:30',
      room: 'Room 302, Block A',
    });

    // 16. Seed Notifications (Demo notification for Student 1 and Teacher 1)
    console.log('Seeding Notifications... 🔔');
    const uAlex = await User.findOne({ email: sAlex.email });
    const uJenkins = await User.findOne({ email: tJenkins.email });

    if (uAlex) {
      await Notification.create({
        recipient: uAlex._id,
        title: 'Marks Published',
        message:
          'Your results for Database Management Systems (CS401) have been published. Check your grades card.',
        isRead: false,
      });

      await Notification.create({
        recipient: uAlex._id,
        title: 'New Assignment Posted',
        message:
          'Dr. Sarah Jenkins posted a new assignment: "Relational Algebra Exercise Sheet" due in 5 days.',
        isRead: true,
      });
    }

    if (uJenkins) {
      await Notification.create({
        recipient: uJenkins._id,
        title: 'Assignment Submission',
        message: 'Alex Rivera submitted a file for: "Relational Algebra Exercise Sheet".',
        isRead: false,
      });
    }

    console.log('Database seeded successfully! 🌱');
    console.log('\n==================================================');
    console.log('DEMO LOGINS (Password: Password123 for all accounts):');
    console.log('--------------------------------------------------');
    console.log('Teacher (Sarah Jenkins): teacher1@edusphere.edu');
    console.log('Student (Alex Rivera):   student1@edusphere.edu');
    console.log('==================================================\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding: 💥', error);
    process.exit(1);
  }
};

seedDB();
