import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Batch from "../models/batch.model.js";
import Department from "../models/department.model.js";
import Discipline from "../models/discipline.model.js";
import User from "../models/user.model.js";
import Subject from "../models/subject.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import Attendance from "../models/attendance.model.js";
import Session from "../models/session.model.js";
import xlsx from "xlsx";
import bcrypt from "bcryptjs";

// @desc    Create a new batch from Excel and auto-section students
// @route   POST /api/v2/academic/batch/create
// @access  Admin
export const createBatch = asyncHandler(async (req, res) => {
  // 1. Parse multipart form fields
  const { name, departmentId, disciplineId, maxStudentsPerSection } = req.body;
  const capacity = parseInt(maxStudentsPerSection, 10);

  // 2. Validate references exist
  const [dept, disc] = await Promise.all([
    Department.findById(departmentId),
    Discipline.findById(disciplineId),
  ]);
  if (!dept) throw new ApiError(404, "Department not found");
  if (!disc) throw new ApiError(404, "Discipline not found");
  if (disc.departmentId.toString() !== departmentId) {
    throw new ApiError(400, "Discipline does not belong to this department");
  }

  // 3. Parse Excel from memory buffer (multer memoryStorage)
  if (!req.file) {
    throw new ApiError(400, "Excel file is required");
  }
  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet); // [{Name, Username, "Roll No"}, ...]

  if (!rows || rows.length === 0) {
    throw new ApiError(400, "Excel file is empty or has no data rows");
  }

  // 4. Validate required columns
  const requiredCols = ["Name", "Username", "Roll No"];
  const actualCols = Object.keys(rows[0]);
  for (const col of requiredCols) {
    if (!actualCols.includes(col)) {
      throw new ApiError(400, `Missing required column: "${col}"`);
    }
  }

  // 5. Calculate sections
  const totalStudents = rows.length;
  const numSections = Math.ceil(totalStudents / capacity);
  const sectionLabels = Array.from({ length: numSections }, (_, i) =>
    String.fromCharCode(65 + i) // A, B, C, ...
  );

  // 6. Create Batch document first
  const batchName = `${disc.code} - ${name}`;
  const batch = await Batch.create({
    name: batchName,
    departmentId,
    disciplineId,
    startingYear: new Date().getFullYear(),
    maxStudentsPerSection: capacity,
    currentSemester: 1,
    sections: sectionLabels.map(label => ({ name: label })),
  });

  // 7. Build user documents for insertMany
  const defaultPasswordHash = await bcrypt.hash(
    process.env.DEFAULT_STUDENT_PASSWORD || "password123",
    10
  );

  const userDocs = rows.map((row, index) => {
    const sectionLabel = sectionLabels[Math.floor(index / capacity)];
    return {
      username: row["Username"].toString().trim(),
      name: row["Name"].toString().trim(),
      email: `${row["Username"].toString().trim().toLowerCase()}@csit-ams.edu`,
      password: defaultPasswordHash,
      role: "student",
      accountStatus: "Active",
      mustChangePassword: true,
      info: {
        rollNo: row["Roll No"].toString().trim(),
        section: sectionLabel,
        semester: 1,
        batchId: batch._id,
        departmentId,
        disciplineId,
      },
    };
  });

  // 8. Bulk insert with ordered: false (continue even if some fail)
  let insertResult;
  try {
    insertResult = await User.insertMany(userDocs, {
      ordered: false,
    });
  } catch (err) {
    // Handle partial success (some usernames already exist)
    if (err.code === 11000) {
      const failedUsernames = err.writeErrors?.map(e =>
        e.err.op?.username
      ) || [];
      return res.status(207).json(new ApiResponse(207, {
        batchId: batch._id,
        totalRows: rows.length,
        inserted: rows.length - (err.writeErrors?.length || 0),
        duplicates: failedUsernames,
        sections: sectionLabels,
      }, "Batch created with some duplicates skipped"));
    }
    throw err;
  }

  res.status(201).json(new ApiResponse(201, {
    batch,
    studentsCreated: insertResult.length,
    sections: sectionLabels.map((label, i) => ({
      section: label,
      count: i < numSections - 1
        ? capacity
        : totalStudents - (i * capacity),
    })),
  }, `Batch created successfully. ${insertResult.length} students enrolled in ${numSections} section(s).`));
});


// @desc    Assign subject and teacher to sections
// @route   POST /api/v2/academic/allocation/assign
// @access  Admin
export const allocateCourse = asyncHandler(async (req, res) => {
  const { batchId, teacherAssignments } = req.body;
  // teacherAssignments: [{ subjectId, sections: [{ name: "A", teacherId }] }]

  const batch = await Batch.findById(batchId).populate("disciplineId");
  if (!batch) throw new ApiError(404, "Batch not found");
  if (!batch.isActive) throw new ApiError(400, "Batch is not active");

  const currentSemester = batch.currentSemester;
  const discipline = batch.disciplineId;

  // Find the subjects for this semester in syllabus
  const semesterMap = discipline.syllabus.find(s => s.semester === currentSemester);
  const allowedSubjects = semesterMap ? semesterMap.subjects.map(s => s.toString()) : [];

  const createdAllocations = [];

  for (const assignment of teacherAssignments) {
    const { subjectId, sections } = assignment;
    
    if (!allowedSubjects.includes(subjectId.toString())) {
      throw new ApiError(400, `Subject ${subjectId} is not in the syllabus for semester ${currentSemester}`);
    }

    // Check if sections provided by admin; if not, use batch sections
    let currentSections = sections && sections.length > 0 ? sections : batch.sections;
    if (!currentSections || currentSections.length === 0) {
      throw new ApiError(400, "No sections provided and batch has no saved sections.");
    }

    // Verify all teachers exist
    const teacherIds = currentSections.map(s => s.teacherId).filter(Boolean);
    const teachers = await User.find({ _id: { $in: teacherIds }, role: "teacher", accountStatus: "Active" });
    if (teachers.length !== Array.from(new Set(teacherIds)).length) {
      throw new ApiError(400, "One or more teachers are invalid or inactive");
    }

    // Fetch students to populate the section's students array
    const populatedSections = [];
    for (const sec of currentSections) {
      if (!sec.teacherId) {
        throw new ApiError(400, `Teacher ID is required for section ${sec.name}`);
      }
      const students = await User.find({ 
        "info.batchId": batch._id, 
        "info.section": sec.name,
        role: "student",
        accountStatus: "Active"
      }).select("_id");

      populatedSections.push({
        name: sec.name,
        teacherId: sec.teacherId,
        students: students.map(s => s._id)
      });
    }

    const allocation = await CourseAllocation.findOneAndUpdate(
      { subjectId, batchId, semester: currentSemester },
      { sections: populatedSections, isActive: true },
      { upsert: true, new: true }
    );
    createdAllocations.push(allocation);
  }

  res.status(200).json(new ApiResponse(200, createdAllocations, "Courses allocated successfully"));
});

// @desc    Promote batch to next semester
// @route   POST /api/v2/academic/batch/:id/promote
// @access  Admin
export const promoteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const batch = await Batch.findById(id).populate("disciplineId");

  if (!batch) throw new ApiError(404, "Batch not found");
  if (!batch.isActive) throw new ApiError(400, "Batch is not active");
  if (batch.currentSemester >= batch.disciplineId.totalSemesters) {
    throw new ApiError(400, `Batch has already completed all ${batch.disciplineId.totalSemesters} semesters`);
  }

  const oldSemester = batch.currentSemester;
  const newSemester = oldSemester + 1;

  // 1. Deactivate all current CourseAllocations
  await CourseAllocation.updateMany(
    { batchId: id, semester: oldSemester, isActive: true },
    { $set: { isActive: false } }
  );

  // 2. Increment batch semester and snapshot sections if missing
  batch.previousSemester = oldSemester;
  batch.currentSemester = newSemester;
  if (!batch.sections || batch.sections.length === 0) {
    const students = await User.aggregate([
      { $match: { role: "student", "info.batchId": batch._id, "info.section": { $exists: true } } },
      { $group: { _id: "$info.section" } }
    ]);
    batch.sections = students.filter(s => s._id).map(s => ({ name: s._id }));
  }
  await batch.save();

  // 3. Sync all student semester values to the batch's new semester
  await User.updateMany(
    { "info.batchId": id, role: "student" },
    { $set: { "info.semester": newSemester } }
  );

  res.status(200).json(new ApiResponse(200, {
    batch,
    promotedFrom: oldSemester,
    promotedTo: newSemester,
    message: `Batch promoted to Semester ${newSemester}. Please create course allocations for the new semester.`,
  }, "Batch promoted successfully"));
});

// @desc    Rollback previous promotion
// @route   POST /api/v2/academic/batch/:id/rollback
// @access  Admin
export const rollbackPromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const batch = await Batch.findById(id);

  if (!batch) throw new ApiError(404, "Batch not found");
  if (batch.currentSemester <= 1) {
    throw new ApiError(400, "Cannot rollback beyond semester 1");
  }

  const currentSem = batch.currentSemester;
  const previousSem = batch.currentSemester - 1;

  // 1. Delete allocations for the rolled-back semester
  await CourseAllocation.deleteMany({ batchId: id, semester: currentSem });

  // 2. Reactivate allocations for the previous semester
  await CourseAllocation.updateMany(
    { batchId: id, semester: previousSem },
    { $set: { isActive: true } }
  );

  // 3. Rollback batch
  batch.currentSemester = previousSem;
  batch.previousSemester = previousSem > 1 ? previousSem - 1 : null;
  await batch.save();

  // 4. Rollback students to the previous semester
  await User.updateMany(
    { "info.batchId": id, role: "student" },
    { $set: { "info.semester": previousSem } }
  );

  res.status(200).json(new ApiResponse(200, {
    batch,
    rolledBackTo: previousSem
  }, "Batch promotion rolled back successfully"));
});

// @desc    Get all batches
// @route   GET /api/v2/academic/batches
// @access  Admin
export const getBatches = asyncHandler(async (req, res) => {
  const { departmentId, isActive } = req.query;
  const query = {};
  if (departmentId) query.departmentId = departmentId;
  if (isActive !== undefined) query.isActive = isActive === "true" || isActive === true;

  const batches = await Batch.find(query)
    .populate("departmentId", "name code")
    .populate("disciplineId", "name code")
    .sort({ startingYear: -1, name: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, batches, "Batches retrieved successfully"));
});

// @desc    Update a batch (name, capacity)
// @route   PATCH /api/v2/academic/batch/:id
// @access  Admin
export const updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, maxStudentsPerSection } = req.body;

  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");

  if (name !== undefined && name.trim()) batch.name = name.trim();
  if (maxStudentsPerSection !== undefined) {
    const cap = parseInt(maxStudentsPerSection, 10);
    if (isNaN(cap) || cap < 1) throw new ApiError(400, "Invalid capacity value");
    batch.maxStudentsPerSection = cap;
  }

  await batch.save();

  const updated = await Batch.findById(batch._id)
    .populate("departmentId", "name code")
    .populate("disciplineId", "name code")
    .lean();

  res.status(200).json(new ApiResponse(200, updated, "Batch updated successfully"));
});

// @desc    Get sections of a batch
// @route   GET /api/v2/academic/batch/:id/sections
// @access  Admin
export const getBatchSections = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");
  
  res.status(200).json(new ApiResponse(200, batch.sections || [], "Batch sections retrieved successfully"));
});

// @desc    Get batch details
// @route   GET /api/v2/academic/batch/:id
// @access  Admin
export const getBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id)
    .populate("departmentId", "name code")
    .populate({
      path: "disciplineId",
      select: "name code totalSemesters syllabus",
      populate: {
        path: "syllabus.subjects",
        select: "name code creditHours"
      }
    })
    .lean();

  if (!batch) throw new ApiError(404, "Batch not found");

  const studentCount = await User.countDocuments({ "info.batchId": batch._id, role: "student" });

  res.status(200).json(new ApiResponse(200, { ...batch, studentCount }, "Batch details retrieved"));
});

// @desc    Get allocations for a batch
// @route   GET /api/v2/academic/allocations
// @access  Admin
export const getAllocations = asyncHandler(async (req, res) => {
  const { batchId, semester, isActive } = req.query;

  const query = {};
  if (batchId) query.batchId = batchId;
  if (semester) query.semester = semester;
  if (isActive !== undefined) query.isActive = isActive === "true" || isActive === true;

  const allocations = await CourseAllocation.find(query)
    .populate("subjectId", "name code creditHours")
    .populate("batchId", "name semester academicYear")
    .populate("sections.teacherId", "name username")
    .populate({
      path: "sections.students",
      select: "name info.rollNo"
    })
    .lean();

  res.status(200).json(new ApiResponse(200, allocations, "Allocations retrieved successfully"));
});

// @desc    Get student dashboard stats
// @route   GET /api/v2/academic/student/dashboard
// @access  Student
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const { batchId, section } = req.user.info;
  if (!batchId || !section) throw new ApiError(400, "Student missing batch or section info");

  const batch = await Batch.findById(batchId).populate("disciplineId");
  if (!batch || !batch.isActive) throw new ApiError(400, "No active batch found");

  const allocations = await CourseAllocation.find({
    batchId,
    semester: batch.currentSemester,
    isActive: true,
    "sections.name": section
  }).populate("subjectId", "name code creditHours")
    .populate("sections.teacherId", "name");

  // Calculate attendance for each subject
  const currentSubjects = await Promise.all(allocations.map(async (alloc) => {
    const sec = alloc.sections.find(s => s.name === section);
    
    // total sessions for this allocation + section
    const totalSessions = await Session.countDocuments({
      allocationId: alloc._id,
      sectionName: section
    });

    const presentCount = await Attendance.countDocuments({
      studentId: req.user._id,
      allocationId: alloc._id,
      section: section,
      status: "Present"
    });

    return {
      id: alloc._id, // allocation ID serves as unique subject identifier for student
      subjectId: alloc.subjectId._id,
      name: alloc.subjectId.name,
      code: alloc.subjectId.code,
      teacher: sec?.teacherId?.name || "Unknown",
      present: presentCount,
      total: totalSessions
    };
  }));

  res.status(200).json(new ApiResponse(200, { currentSubjects }, "Student dashboard retrieved"));
});

// @desc    Get student history
// @route   GET /api/v2/academic/student/history
// @access  Student
export const getStudentHistory = asyncHandler(async (req, res) => {
  const { batchId, section } = req.user.info;
  if (!batchId || !section) throw new ApiError(400, "Student missing batch or section info");

  const batch = await Batch.findById(batchId);
  if (!batch) throw new ApiError(400, "Batch not found");

  // Get past allocations
  const pastAllocations = await CourseAllocation.find({
    batchId,
    semester: { $lt: batch.currentSemester },
    "sections.name": section
  }).populate("subjectId", "name code creditHours")
    .sort({ semester: -1 });

  const pastSemestersMap = {};

  for (const alloc of pastAllocations) {
    if (!pastSemestersMap[alloc.semester]) {
      pastSemestersMap[alloc.semester] = { sem: alloc.semester, subjects: [] };
    }

    const totalSessions = await Session.countDocuments({
      allocationId: alloc._id,
      sectionName: section
    });

    const presentCount = await Attendance.countDocuments({
      studentId: req.user._id,
      allocationId: alloc._id,
      section: section,
      status: "Present"
    });

    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
    
    // Status based on 75% attendance rule
    let status = percentage >= 75 ? "Cleared" : "Barred";

    pastSemestersMap[alloc.semester].subjects.push({
      id: alloc._id,
      name: alloc.subjectId.name,
      status,
      attendance: `${percentage}%`
    });
  }

  const pastSemesters = Object.values(pastSemestersMap).sort((a, b) => b.sem - a.sem);

  res.status(200).json(new ApiResponse(200, { pastSemesters }, "Student history retrieved"));
});

// @desc    Get teacher dashboard
// @route   GET /api/v2/academic/teacher/dashboard
// @access  Teacher
export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const allocations = await CourseAllocation.find({
    "sections.teacherId": req.user._id,
    isActive: true
  })
    .populate("subjectId", "name code")
    .populate("batchId", "name startingYear")
    .lean();

  const activeAllocations = allocations.map(alloc => {
    // Find the section this teacher is assigned to
    // Note: a teacher might be assigned to multiple sections in the same allocation.
    // For simplicity, we create an entry per section.
    return alloc.sections
      .filter(sec => sec.teacherId?.toString() === req.user._id.toString())
      .map(sec => ({
        _id: alloc._id,
        sectionName: sec.name, // To distinguish in UI
        subjectName: alloc.subjectId?.name || "Unknown Subject",
        subjectCode: alloc.subjectId?.code || "---",
        batch: alloc.batchId?.name || "Unknown Batch",
        section: sec.name,
        semester: alloc.semester,
        students: sec.students.length
      }));
  }).flat();

  res.status(200).json(new ApiResponse(200, { activeAllocations }, "Teacher dashboard retrieved"));
});

// @desc    Get teacher history (past classes)
// @route   GET /api/v2/academic/teacher/history
// @access  Teacher
export const getTeacherHistory = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    teacherId: req.user._id,
    active: false
  })
    .populate({
      path: "allocationId",
      select: "subjectId semester batchId sections",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "batchId", select: "name" }
      ]
    })
    .sort({ endTime: -1 })
    .lean();

  const pastClasses = await Promise.all(sessions.map(async (sess) => {
    const presentCount = await Attendance.countDocuments({
      sessionId: sess._id,
      status: "Present"
    });
    
    // Find total students in that section from allocation
    let total = 0;
    if (sess.allocationId) {
       const sec = sess.allocationId.sections.find(s => s.name === sess.sectionName);
       if (sec) total = sec.students.length;
    }

    return {
      _id: sess._id,
      allocationId: sess.allocationId?._id || sess.allocationId,
      subject: sess.allocationId?.subjectId?.name || "Unknown",
      section: sess.sectionName,
      date: new Date(sess.startTime).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' }),
      type: sess.type,
      present: presentCount,
      total
    };
  }));

  res.status(200).json(new ApiResponse(200, { pastClasses }, "Teacher history retrieved"));
});

// @desc    Get class details (roster & stats)
// @route   GET /api/v2/academic/teacher/class/:allocationId/:sectionName
// @access  Teacher
export const getClassDetails = asyncHandler(async (req, res) => {
  const { allocationId, sectionName } = req.params;

  const allocation = await CourseAllocation.findById(allocationId)
    .populate("subjectId", "name code")
    .populate("batchId", "name")
    .populate({
      path: "sections.students",
      select: "name info.rollNo"
    });

  if (!allocation) throw new ApiError(404, "Allocation not found");

  const section = allocation.sections.find(s => s.name === sectionName);
  if (!section) throw new ApiError(404, "Section not found");

  if (section.teacherId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to view this class");
  }

  const totalSessions = await Session.countDocuments({
    allocationId,
    sectionName
  });

  // Fetch past sessions for the session history panel
  const rawSessions = await Session.find({
    allocationId,
    sectionName,
    active: false
  }).sort({ endTime: -1 }).limit(10).lean();

  const sessions = await Promise.all(rawSessions.map(async (sess) => {
    const presentCount = await Attendance.countDocuments({
      sessionId: sess._id,
      status: "Present"
    });
    return {
      _id: sess._id,
      date: new Date(sess.startTime).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' }),
      type: sess.type || "Lecture",
      present: presentCount,
      total: section.students.length
    };
  }));

  const students = await Promise.all(section.students.map(async (student) => {
    const presentCount = await Attendance.countDocuments({
      studentId: student._id,
      allocationId,
      section: sectionName,
      status: "Present"
    });

    return {
      id: student._id,
      name: student.name,
      rollNo: student.info?.rollNo,
      present: presentCount,
      total: totalSessions
    };
  }));

  res.status(200).json(new ApiResponse(200, {
    subject: allocation.subjectId,
    batch: allocation.batchId,
    section: sectionName,
    semester: allocation.semester,
    students,
    sessions
  }, "Class details retrieved"));
});

// @desc    Get class sessions paginated
// @route   GET /api/v2/academic/teacher/class/:allocationId/:sectionName/sessions
// @access  Teacher
export const getClassSessions = asyncHandler(async (req, res) => {
  const { allocationId, sectionName } = req.params;
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 10;

  const allocation = await CourseAllocation.findById(allocationId)
    .populate("subjectId", "name code")
    .populate("batchId", "name")
    .populate("sections.teacherId", "name")
    .lean();
  if (!allocation) throw new ApiError(404, "Allocation not found");
  const section = allocation.sections.find(s => s.name === sectionName);
  if (!section) throw new ApiError(404, "Section not found");

  if (section.teacherId._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    throw new ApiError(403, "Not authorized to view this class");
  }

  const rawSessions = await Session.find({
    allocationId,
    sectionName,
    active: false
  }).sort({ endTime: -1 }).skip(skip).limit(limit).lean();

  const sessions = await Promise.all(rawSessions.map(async (sess) => {
    const presentCount = await Attendance.countDocuments({
      sessionId: sess._id,
      status: "Present"
    });
    return {
      _id: sess._id,
      date: new Date(sess.startTime).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' }),
      startTime: sess.startTime,
      endTime: sess.endTime,
      type: sess.type || "Lecture",
      present: presentCount,
      total: section.students.length,
      attendanceRecords: new Array(presentCount) // mock for history length check
    };
  }));

  const total = await Session.countDocuments({ allocationId, sectionName, active: false });

  res.status(200).json(new ApiResponse(200, { 
    sessions, 
    total, 
    hasMore: skip + sessions.length < total,
    subject: allocation.subjectId,
    batch: allocation.batchId,
    teacher: section.teacherId
  }, "Sessions retrieved"));
});

// @desc    Get specific student's attendance report for a class
// @route   GET /api/v2/academic/teacher/class/:allocationId/:sectionName/student/:studentId/report
// @access  Teacher
export const getStudentClassReport = asyncHandler(async (req, res) => {
  const { allocationId, sectionName, studentId } = req.params;

  const allocation = await CourseAllocation.findById(allocationId).populate("subjectId", "name code").lean();
  if (!allocation) throw new ApiError(404, "Allocation not found");
  
  const student = await User.findById(studentId).select("name info.rollNo").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const sessions = await Session.find({ allocationId, sectionName, active: false }).sort({ startTime: 1 }).lean();
  
  const attendanceRecords = await Attendance.find({
    studentId,
    allocationId,
    section: sectionName
  }).lean();

  const attendanceMap = {};
  attendanceRecords.forEach(record => {
    attendanceMap[record.sessionId.toString()] = record.status;
  });

  const report = sessions.map(sess => ({
    sessionId: sess._id,
    date: new Date(sess.startTime).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' }),
    type: sess.type || "Lecture",
    status: attendanceMap[sess._id.toString()] || "Absent"
  }));

  const presentCount = report.filter(r => r.status === "Present").length;
  const total = report.length;

  res.status(200).json(new ApiResponse(200, {
    student: { name: student.name, rollNo: student.info?.rollNo },
    subject: { name: allocation.subjectId.name, code: allocation.subjectId.code },
    summary: { present: presentCount, total },
    history: report
  }, "Student report retrieved"));
});

// @desc    Transfer a student to a different section
// @route   POST /api/v2/academic/student/:id/transfer
// @access  Admin
export const transferStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newSection } = req.body;

  if (!newSection) {
    throw new ApiError(400, "New section name is required");
  }

  const student = await User.findById(id);
  if (!student || student.role !== "student") {
    throw new ApiError(404, "Student not found");
  }

  const currentSection = student.info.section;
  if (currentSection === newSection) {
    throw new ApiError(400, "Student is already in this section");
  }

  // Find all active course allocations for this student's batch
  const allocations = await CourseAllocation.find({
    batchId: student.info.batchId,
    isActive: true,
  });

  for (const alloc of allocations) {
    let studentMoved = false;

    // Check if new section exists in this allocation
    const newSecExists = alloc.sections.some(s => s.name === newSection);
    if (!newSecExists) {
      throw new ApiError(400, `Cannot transfer: Section ${newSection} does not exist in active allocations`);
    }

    // Remove from old section
    for (const sec of alloc.sections) {
      if (sec.name === currentSection) {
        sec.students = sec.students.filter(
          (studentId) => studentId.toString() !== id.toString()
        );
      }
    }

    // Add to new section
    for (const sec of alloc.sections) {
      if (sec.name === newSection) {
        sec.students.push(id);
        studentMoved = true;
      }
    }

    if (studentMoved) {
      await alloc.save();
    }
  }

  // Update student profile
  student.info.section = newSection;
  await student.save();

  res.status(200).json(new ApiResponse(200, student, `Student transferred to section ${newSection} successfully`));
});

// @desc    Get student's attendance records for a specific class
// @route   GET /api/v2/academic/student/class/:allocationId/attendance
// @access  Student
export const getStudentAttendanceForClass = asyncHandler(async (req, res) => {
  const { allocationId } = req.params;
  const studentId = req.user._id;

  const allocation = await CourseAllocation.findById(allocationId)
    .populate("subjectId", "name code")
    .populate({
      path: "sections.teacherId",
      select: "name"
    })
    .lean();
  if (!allocation) throw new ApiError(404, "Allocation not found");

  const sec = allocation.sections.find(s => 
    s.students.some(id => id.toString() === studentId.toString())
  );
  if (!sec) throw new ApiError(403, "You are not enrolled in this class");
  
  const sectionName = sec.name;
  const teacherName = sec?.teacherId?.name || "Unknown";

  // All sessions for this allocation+section
  const sessions = await Session.find({
    allocationId,
    sectionName: sectionName,
    active: false
  }).sort({ startTime: -1 }).lean();

  // All attendance records for this student in this allocation
  const attendanceRecords = await Attendance.find({
    studentId,
    allocationId,
    section: sectionName
  }).lean();

  const attendanceMap = {};
  attendanceRecords.forEach(rec => {
    attendanceMap[rec.sessionId.toString()] = {
      status: rec.status,
      markedAt: rec.updatedAt || rec.createdAt
    };
  });

  const sessionList = sessions.map(sess => {
    const rec = attendanceMap[sess._id.toString()];
    return {
      _id: sess._id,
      date: sess.startTime,
      type: sess.type || "Lecture",
      status: rec?.status || "Absent",
      markedAt: rec?.markedAt || null
    };
  });

  const presentCount = sessionList.filter(s => s.status === "Present" || s.status === "Present (Manual)").length;

  res.status(200).json(new ApiResponse(200, {
    subject: {
      name: allocation.subjectId.name,
      code: allocation.subjectId.code,
      teacher: teacherName
    },
    summary: { present: presentCount, total: sessionList.length },
    sessions: sessionList
  }, "Student attendance retrieved"));
});
