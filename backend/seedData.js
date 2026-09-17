import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import User from "./src/models/user.model.js";
import Department from "./src/models/department.model.js";
import Discipline from "./src/models/discipline.model.js";
import Subject from "./src/models/subject.model.js";
import Batch from "./src/models/batch.model.js";
import CourseAllocation from "./src/models/courseAllocation.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found in environment variables.");
  process.exit(1);
}

async function seedData() {
  try {
    console.log("Connecting to MongoDB for test data seeding...");
    await mongoose.connect(uri);
    console.log(`Connected to database: ${mongoose.connection.name}`);

    // 1. Ensure Super Admin exists
    let admin = await User.findOne({ username: "admin" });
    if (!admin) {
      console.log("Creating Super Admin...");
      admin = await User.create({
        name: "Super Admin",
        email: "admin@csit-ams.edu",
        username: "admin",
        password: "AdminPassword123!",
        role: "admin",
        accountStatus: "Active",
        mustChangePassword: false,
      });
      console.log("Super Admin created.");
    } else {
      console.log("Super Admin already exists.");
    }

    // 2. Create Department
    console.log("\nSeeding Department...");
    let department = await Department.findOne({ code: "ICSIT" });
    if (!department) {
      department = await Department.create({
        name: "Institute of Computer Science & Information Technology",
        code: "ICSIT",
      });
      console.log(`Department created: ${department.name} (${department.code})`);
    } else {
      console.log(`Department exists: ${department.code}`);
    }

    // 3. Create Subjects
    console.log("\nSeeding Subjects...");
    const subjectsData = [
      { name: "Programming Fundamentals", code: "CS-101", creditHours: 4 },
      { name: "Object Oriented Programming", code: "CS-102", creditHours: 4 },
      { name: "Discrete Structures", code: "CS-103", creditHours: 3 },
      { name: "Data Structures & Algorithms", code: "CS-201", creditHours: 4 },
      { name: "Database Systems", code: "CS-202", creditHours: 4 },
      { name: "Digital Logic Design", code: "CS-203", creditHours: 3 },
      { name: "Computer Networks", code: "CS-301", creditHours: 3 },
      { name: "Operating Systems", code: "CS-302", creditHours: 4 },
      { name: "Web Engineering", code: "CS-303", creditHours: 3 },
      { name: "Software Engineering", code: "SE-201", creditHours: 3 },
      { name: "Artificial Intelligence", code: "CS-401", creditHours: 3 },
      { name: "Information Security", code: "CS-402", creditHours: 3 },
    ];

    const subjectDocs = {};
    for (const sub of subjectsData) {
      let s = await Subject.findOne({ code: sub.code });
      if (!s) {
        s = await Subject.create({
          ...sub,
          departmentId: department._id,
        });
        console.log(`  + Created Subject: [${s.code}] ${s.name} (${s.creditHours} cr)`);
      } else {
        console.log(`  • Subject exists: [${s.code}] ${s.name}`);
      }
      subjectDocs[sub.code] = s;
    }

    // 4. Create Disciplines with Curriculum Syllabus
    console.log("\nSeeding Disciplines with Curriculum...");
    let bscs = await Discipline.findOne({ code: "BSCS" });
    const bscsSyllabus = [
      { semester: 1, subjects: [subjectDocs["CS-101"]._id, subjectDocs["CS-103"]._id] },
      { semester: 2, subjects: [subjectDocs["CS-102"]._id, subjectDocs["CS-203"]._id] },
      { semester: 3, subjects: [subjectDocs["CS-201"]._id, subjectDocs["CS-202"]._id, subjectDocs["SE-201"]._id] },
      { semester: 4, subjects: [subjectDocs["CS-301"]._id, subjectDocs["CS-302"]._id] },
      { semester: 5, subjects: [subjectDocs["CS-303"]._id, subjectDocs["CS-401"]._id] },
      { semester: 6, subjects: [subjectDocs["CS-402"]._id] },
    ];

    if (!bscs) {
      bscs = await Discipline.create({
        name: "Bachelor of Science in Computer Science",
        code: "BSCS",
        departmentId: department._id,
        totalSemesters: 8,
        syllabus: bscsSyllabus,
      });
      console.log(`Created Discipline: ${bscs.name} (${bscs.code})`);
    } else {
      bscs.syllabus = bscsSyllabus;
      await bscs.save();
      console.log(`Updated syllabus for: ${bscs.code}`);
    }

    let bsse = await Discipline.findOne({ code: "BSSE" });
    if (!bsse) {
      bsse = await Discipline.create({
        name: "Bachelor of Science in Software Engineering",
        code: "BSSE",
        departmentId: department._id,
        totalSemesters: 8,
        syllabus: [
          { semester: 1, subjects: [subjectDocs["CS-101"]._id] },
          { semester: 2, subjects: [subjectDocs["CS-102"]._id] },
          { semester: 3, subjects: [subjectDocs["SE-201"]._id, subjectDocs["CS-201"]._id] },
          { semester: 4, subjects: [subjectDocs["CS-202"]._id, subjectDocs["CS-303"]._id] },
        ],
      });
      console.log(`Created Discipline: ${bsse.name} (${bsse.code})`);
    }

    // 5. Create Teachers
    console.log("\nSeeding Teachers...");
    const teachersData = [
      {
        name: "Dr. Kamran Ali",
        email: "kamran.ali@csit-ams.edu",
        username: "kamran.ali",
        designation: "Assistant Professor",
        phone: "+92 300 1112233",
      },
      {
        name: "Prof. Ayesha Siddiqa",
        email: "ayesha.siddiqa@csit-ams.edu",
        username: "ayesha.siddiqa",
        designation: "Associate Professor",
        phone: "+92 301 2223344",
      },
      {
        name: "Engr. Bilal Hassan",
        email: "bilal.hassan@csit-ams.edu",
        username: "bilal.hassan",
        designation: "Lecturer",
        phone: "+92 302 3334455",
      },
      {
        name: "Dr. Zainab Tariq",
        email: "zainab.tariq@csit-ams.edu",
        username: "zainab.tariq",
        designation: "Assistant Professor",
        phone: "+92 303 4445566",
      },
    ];

    const teacherDocs = {};
    for (const t of teachersData) {
      let teacher = await User.findOne({ username: t.username });
      if (!teacher) {
        teacher = await User.create({
          name: t.name,
          email: t.email,
          username: t.username,
          password: "Teacher123!",
          role: "teacher",
          accountStatus: "Active",
          mustChangePassword: false,
          loginAttempts: 0,
          lockUntil: null,
          info: {
            designation: t.designation,
            phone: t.phone,
            departmentId: department._id,
            disciplineId: bscs._id,
          },
        });
        console.log(`  + Created Teacher: ${t.name} (${t.username}) - ${t.designation}`);
      } else {
        // Fix password and ensure account is unlocked
        teacher.password = "Teacher123!";
        teacher.loginAttempts = 0;
        teacher.lockUntil = null;
        teacher.accountStatus = "Active";
        teacher.mustChangePassword = false;
        await teacher.save();
        console.log(`  • Updated & Unlocked Teacher: ${t.name} (${t.username}) [password reset to Teacher123!]`);
      }
      teacherDocs[t.username] = teacher;
    }

    // 6. Create Batches with Manual Sections
    console.log("\nSeeding Batches...");

    // Active Batch: BSCS - Fall 2024 (Semester 3)
    let batchFall24 = await Batch.findOne({ name: "BSCS - Fall 2024" });
    if (!batchFall24) {
      batchFall24 = await Batch.create({
        name: "BSCS - Fall 2024",
        departmentId: department._id,
        disciplineId: bscs._id,
        startingYear: 2024,
        currentSemester: 3,
        isActive: true,
        sections: [
          { name: "A", status: "active", studentCount: 0 },
          { name: "B", status: "active", studentCount: 0 },
          { name: "Morning", status: "active", studentCount: 0 },
        ],
        semesterSubjects: [
          {
            semester: 3,
            subjects: [
              subjectDocs["CS-201"]._id, // Data Structures
              subjectDocs["CS-202"]._id, // Database Systems
              subjectDocs["SE-201"]._id, // Software Engineering
            ],
          },
        ],
      });
      console.log(`Created Active Batch: ${batchFall24.name} (3 sections)`);
    } else {
      console.log(`Batch exists: ${batchFall24.name}`);
    }

    // Active Batch: BSSE - Fall 2023 (Semester 4)
    let batchFall23 = await Batch.findOne({ name: "BSSE - Fall 2023" });
    if (!batchFall23) {
      batchFall23 = await Batch.create({
        name: "BSSE - Fall 2023",
        departmentId: department._id,
        disciplineId: bsse._id,
        startingYear: 2023,
        currentSemester: 4,
        isActive: true,
        sections: [
          { name: "A", status: "active", studentCount: 0 },
          { name: "B", status: "active", studentCount: 0 },
        ],
      });
      console.log(`Created Active Batch: ${batchFall23.name} (2 sections)`);
    }

    // Completed Batch: BSCS - Class of 2024 (Semester 0, Inactive)
    let completedBatch = await Batch.findOne({ name: "BSCS - Class of 2024" });
    if (!completedBatch) {
      completedBatch = await Batch.create({
        name: "BSCS - Class of 2024",
        departmentId: department._id,
        disciplineId: bscs._id,
        startingYear: 2020,
        currentSemester: 0,
        isActive: false,
        sections: [
          { name: "A", status: "active", studentCount: 0 },
        ],
      });
      console.log(`Created Completed Batch: ${completedBatch.name} (Ready to test Delete Batch)`);
    }

    // 7. Create Course Allocations for BSCS - Fall 2024 (Semester 3)
    console.log("\nSeeding Course Allocations...");
    const allocationsToSeed = [
      {
        subjectId: subjectDocs["CS-201"]._id, // Data Structures
        teacherA: teacherDocs["kamran.ali"]._id,
        teacherB: teacherDocs["ayesha.siddiqa"]._id,
        teacherM: teacherDocs["kamran.ali"]._id,
      },
      {
        subjectId: subjectDocs["CS-202"]._id, // Database Systems
        teacherA: teacherDocs["bilal.hassan"]._id,
        teacherB: teacherDocs["zainab.tariq"]._id,
        teacherM: teacherDocs["bilal.hassan"]._id,
      },
    ];

    for (const alloc of allocationsToSeed) {
      await CourseAllocation.findOneAndUpdate(
        { subjectId: alloc.subjectId, batchId: batchFall24._id, semester: 3 },
        {
          sections: [
            { name: "A", teacherId: alloc.teacherA, students: [], allowRetroactiveSessions: false },
            { name: "B", teacherId: alloc.teacherB, students: [], allowRetroactiveSessions: true },
            { name: "Morning", teacherId: alloc.teacherM, students: [], allowRetroactiveSessions: false },
          ],
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }
    console.log("Course allocations created for BSCS - Fall 2024 (Data Structures & Database Systems)");

    // 8. Seed Student Users directly in MongoDB and enroll them in CourseAllocations
    console.log("\nSeeding Students and Synchronizing Course Allocations...");
    const firstNames = ["Ahmed", "Ali", "Fatima", "Zainab", "Usman", "Bilal", "Hamza", "Ayesha", "Hassan", "Maryam", "Omer", "Sana", "Tariq", "Hiba", "Saad", "Noor", "Mustafa", "Sara", "Zeeshan", "Khadija"];
    const lastNames = ["Khan", "Malik", "Raza", "Hussain", "Sheikh", "Chaudhry", "Ansari", "Bhatti", "Qureshi", "Siddiqui"];

    const seedStudentsForSection = async (sectionName, prefix, count, namedLeaders = []) => {
      const studentIds = [];

      // 1. Seed named leader students (e.g., ahmed.khan, usman.sheikh)
      for (const leader of namedLeaders) {
        let student = await User.findOne({ username: leader.username });
        if (!student) {
          student = await User.create({
            name: leader.name,
            email: leader.email,
            username: leader.username,
            password: "Student123!",
            role: "student",
            accountStatus: "Active",
            mustChangePassword: false,
            loginAttempts: 0,
            lockUntil: null,
            info: {
              rollNo: leader.rollNo,
              section: sectionName,
              semester: 3,
              batchId: batchFall24._id,
              departmentId: department._id,
              disciplineId: bscs._id,
            },
          });
          console.log(`  + Created Student Leader: ${leader.name} (${leader.username}) -> Sec ${sectionName}`);
        } else {
          student.password = "Student123!";
          student.accountStatus = "Active";
          student.mustChangePassword = false;
          student.loginAttempts = 0;
          student.lockUntil = null;
          student.info = {
            rollNo: leader.rollNo,
            section: sectionName,
            semester: 3,
            batchId: batchFall24._id,
            departmentId: department._id,
            disciplineId: bscs._id,
          };
          await student.save();
          console.log(`  • Updated Student: ${leader.name} (${leader.username}) -> Sec ${sectionName}`);
        }
        studentIds.push(student._id);
      }

      // 2. Seed sequential roll number students (e.g. CS24-A-001 ... CS24-A-025)
      for (let i = 1; i <= count; i++) {
        const fn = firstNames[(i - 1) % firstNames.length];
        const ln = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length];
        const pad = String(i).padStart(3, "0");
        const rollNo = `${prefix}-${pad}`;
        const username = `${prefix}-${pad}`;
        const email = `${username.toLowerCase()}@csit-ams.edu`;
        const name = `${fn} ${ln}`;

        let student = await User.findOne({ username });
        if (!student) {
          student = await User.create({
            name,
            email,
            username,
            password: "Student123!",
            role: "student",
            accountStatus: "Active",
            mustChangePassword: false,
            loginAttempts: 0,
            lockUntil: null,
            info: {
              rollNo,
              section: sectionName,
              semester: 3,
              batchId: batchFall24._id,
              departmentId: department._id,
              disciplineId: bscs._id,
            },
          });
        } else {
          student.password = "Student123!";
          student.accountStatus = "Active";
          student.mustChangePassword = false;
          student.loginAttempts = 0;
          student.lockUntil = null;
          student.info = {
            rollNo,
            section: sectionName,
            semester: 3,
            batchId: batchFall24._id,
            departmentId: department._id,
            disciplineId: bscs._id,
          };
          await student.save();
        }
        studentIds.push(student._id);
      }

      return studentIds;
    };

    const sectionAStudentIds = await seedStudentsForSection("A", "CS24-A", 25, [
      { name: "Ahmed Khan", username: "ahmed.khan", email: "ahmed.khan@csit-ams.edu", rollNo: "CS24-A-001" },
      { name: "Fatima Malik", username: "fatima.malik", email: "fatima.malik@csit-ams.edu", rollNo: "CS24-A-002" },
      { name: "Ali Raza", username: "ali.raza", email: "ali.raza@csit-ams.edu", rollNo: "CS24-A-003" },
    ]);

    const sectionBStudentIds = await seedStudentsForSection("B", "CS24-B", 25, [
      { name: "Usman Sheikh", username: "usman.sheikh", email: "usman.sheikh@csit-ams.edu", rollNo: "CS24-B-001" },
    ]);

    const sectionMorningStudentIds = await seedStudentsForSection("Morning", "CS24-M", 20, [
      { name: "Hamza Bhatti", username: "hamza.bhatti", email: "hamza.bhatti@csit-ams.edu", rollNo: "CS24-M-001" },
    ]);

    // Update CourseAllocation sections with student ObjectIds
    await CourseAllocation.updateMany(
      { batchId: batchFall24._id, "sections.name": "A" },
      { $set: { "sections.$.students": sectionAStudentIds } }
    );
    await CourseAllocation.updateMany(
      { batchId: batchFall24._id, "sections.name": "B" },
      { $set: { "sections.$.students": sectionBStudentIds } }
    );
    await CourseAllocation.updateMany(
      { batchId: batchFall24._id, "sections.name": "Morning" },
      { $set: { "sections.$.students": sectionMorningStudentIds } }
    );
    console.log(`CourseAllocation sections populated with students: Sec A (${sectionAStudentIds.length}), Sec B (${sectionBStudentIds.length}), Morning (${sectionMorningStudentIds.length})`);

    // Update Batch section studentCount
    await Batch.updateOne(
      { _id: batchFall24._id, "sections.name": "A" },
      { $set: { "sections.$.studentCount": sectionAStudentIds.length } }
    );
    await Batch.updateOne(
      { _id: batchFall24._id, "sections.name": "B" },
      { $set: { "sections.$.studentCount": sectionBStudentIds.length } }
    );
    await Batch.updateOne(
      { _id: batchFall24._id, "sections.name": "Morning" },
      { $set: { "sections.$.studentCount": sectionMorningStudentIds.length } }
    );
    console.log("Batch section student counts updated.");

    // 9. Generate Test Excel Roster Files
    console.log("\nGenerating Sample Excel Files for Section Upload Testing...");
    const rosterDir = path.join(__dirname, "test_rosters");
    if (!fs.existsSync(rosterDir)) {
      fs.mkdirSync(rosterDir, { recursive: true });
    }

    const generateRosterFile = (fileName, prefix, count) => {
      const rows = [];
      for (let i = 1; i <= count; i++) {
        const fn = firstNames[(i - 1) % firstNames.length];
        const ln = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length];
        const pad = String(i).padStart(3, "0");
        rows.push({
          Name: `${fn} ${ln}`,
          Username: `${prefix}-${pad}`,
          "Roll No": `${prefix}-${pad}`,
        });
      }

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(rows);
      xlsx.utils.book_append_sheet(wb, ws, "Students");
      const filePath = path.join(rosterDir, fileName);
      xlsx.writeFile(wb, filePath);
      console.log(`  + Generated: test_rosters/${fileName} (${count} students, e.g. ${rows[0].Username})`);
    };

    generateRosterFile("Section_A_Roster.xlsx", "CS24-A", 25);
    generateRosterFile("Section_B_Roster.xlsx", "CS24-B", 25);
    generateRosterFile("Section_Morning_Roster.xlsx", "CS24-M", 20);

    console.log("\n==================================================================");
    console.log("  ALL TEST DATA SEEDED SUCCESSFULLY!");
    console.log("==================================================================");
    console.log("\n--- ACCOUNTS FOR TESTING ---");
    console.log("1. Super Admin:");
    console.log("   - Username: admin");
    console.log("   - Email:    admin@csit-ams.edu");
    console.log("   - Password: AdminPassword123!");
    console.log("\n2. Teachers (All password: Teacher123!):");
    console.log("   - Dr. Kamran Ali      -> username: kamran.ali");
    console.log("   - Prof. Ayesha        -> username: ayesha.siddiqa");
    console.log("   - Engr. Bilal Hassan  -> username: bilal.hassan");
    console.log("   - Dr. Zainab Tariq    -> username: zainab.tariq");
    console.log("\n3. Students (All password: Student123!):");
    console.log("   - Ahmed Khan          -> username: ahmed.khan OR CS24-A-001 (Sec A)");
    console.log("   - Fatima Malik        -> username: fatima.malik OR CS24-A-002 (Sec A)");
    console.log("   - Ali Raza            -> username: ali.raza OR CS24-A-003 (Sec A)");
    console.log("   - Usman Sheikh        -> username: usman.sheikh OR CS24-B-001 (Sec B)");
    console.log("   - Hamza Bhatti        -> username: hamza.bhatti OR CS24-M-001 (Sec Morning)");
    console.log("\n--- BATCHES AVAILABLE ---");
    console.log("1. BSCS - Fall 2024 (Semester 3, Active) -> Sections: A, B, Morning");
    console.log("2. BSSE - Fall 2023 (Semester 4, Active) -> Sections: A, B");
    console.log("3. BSCS - Class of 2024 (Completed)      -> Ready to test Delete Batch");
    console.log("\n--- EXCEL FILES FOR UPLOAD TESTING ---");
    console.log("1. backend/test_rosters/Section_A_Roster.xlsx       (25 students)");
    console.log("2. backend/test_rosters/Section_B_Roster.xlsx       (25 students)");
    console.log("3. backend/test_rosters/Section_Morning_Roster.xlsx (20 students)");
    console.log("==================================================================\n");

  } catch (err) {
    console.error("Error seeding test data:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

seedData();
