import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Batch from "../models/batch.model.js";
import Department from "../models/department.model.js";
import Discipline from "../models/discipline.model.js";
import User from "../models/user.model.js";
import Subject from "../models/subject.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
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
  const batch = await Batch.create({
    name,
    departmentId,
    disciplineId,
    startingYear: new Date().getFullYear(),
    maxStudentsPerSection: capacity,
    currentSemester: 1,
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

    // Verify all teachers exist
    const teacherIds = sections.map(s => s.teacherId);
    const teachers = await User.find({ _id: { $in: teacherIds }, role: "teacher", accountStatus: "Active" });
    if (teachers.length !== Array.from(new Set(teacherIds)).length) {
      throw new ApiError(400, "One or more teachers are invalid or inactive");
    }

    // Fetch students to populate the section's students array
    const populatedSections = [];
    for (const sec of sections) {
      const students = await User.find({ 
        "info.batchId": batch._id, 
        "info.section": sec.name,
        role: "student"
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

  // 2. Increment batch semester
  batch.previousSemester = oldSemester;
  batch.currentSemester = newSemester;
  await batch.save();

  // 3. Increment all student semester values
  await User.updateMany(
    { "info.batchId": id, role: "student" },
    { $inc: { "info.semester": 1 } }
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

  // 4. Rollback students
  await User.updateMany(
    { "info.batchId": id, role: "student" },
    { $inc: { "info.semester": -1 } }
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
  if (isActive) query.isActive = isActive === "true";

  const batches = await Batch.find(query)
    .populate("departmentId", "name code")
    .populate("disciplineId", "name code")
    .sort({ startingYear: -1, name: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, batches, "Batches retrieved successfully"));
});

// @desc    Get batch details
// @route   GET /api/v2/academic/batch/:id
// @access  Admin
export const getBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id)
    .populate("departmentId", "name code")
    .populate("disciplineId", "name code totalSemesters syllabus")
    .lean();

  if (!batch) throw new ApiError(404, "Batch not found");

  const studentCount = await User.countDocuments({ "info.batchId": batch._id, role: "student" });

  res.status(200).json(new ApiResponse(200, { ...batch, studentCount }, "Batch details retrieved"));
});

// @desc    Get allocations for a batch
// @route   GET /api/v2/academic/allocations
// @access  Admin
export const getAllocations = asyncHandler(async (req, res) => {
  const { batchId, semester } = req.query;
  if (!batchId) throw new ApiError(400, "batchId is required");

  const query = { batchId };
  if (semester) query.semester = semester;

  const allocations = await CourseAllocation.find(query)
    .populate("subjectId", "name code creditHours")
    .populate("sections.teacherId", "name username")
    .lean();

  res.status(200).json(new ApiResponse(200, allocations, "Allocations retrieved successfully"));
});
