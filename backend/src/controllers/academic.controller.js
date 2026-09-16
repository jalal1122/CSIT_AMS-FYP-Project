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
import mongoose from "mongoose";
import { getSystemSetting } from "../utils/settings.js";
import xlsx from "xlsx";
import bcrypt from "bcryptjs";

// @desc    Create a new batch with manually defined sections (no file upload at this step)
// @route   POST /api/v2/academic/batch/create
// @access  Admin
export const createBatch = asyncHandler(async (req, res) => {
  const { name, departmentId, disciplineId, sections } = req.body;

  // 1. Validate required fields
  if (!departmentId || !disciplineId) {
    throw new ApiError(400, "departmentId and disciplineId are required");
  }
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    throw new ApiError(400, "At least one section is required");
  }

  // 2. Validate section names — non-empty + unique within request
  const sectionNames = sections.map(s =>
    (typeof s === "string" ? s.trim() : s?.name?.trim())
  );
  for (const n of sectionNames) {
    if (!n) throw new ApiError(400, "Section names cannot be empty");
  }
  const uniqueNames = new Set(sectionNames.map(n => n.toUpperCase()));
  if (uniqueNames.size !== sectionNames.length) {
    throw new ApiError(400, "Section names must be unique within a batch");
  }

  // 3. Validate references
  const [dept, disc] = await Promise.all([
    Department.findById(departmentId),
    Discipline.findById(disciplineId),
  ]);
  if (!dept) throw new ApiError(404, "Department not found");
  if (!disc) throw new ApiError(404, "Discipline not found");
  if (disc.departmentId.toString() !== departmentId) {
    throw new ApiError(400, "Discipline does not belong to this department");
  }

  // 4. Build batch name
  const suffix = name?.trim() || String(new Date().getFullYear());
  const batchName = `${disc.code} - ${suffix}`;

  // 5. Create batch shell (no students yet)
  const batch = await Batch.create({
    name: batchName,
    departmentId,
    disciplineId,
    startingYear: new Date().getFullYear(),
    currentSemester: 1,
    sections: sectionNames.map(n => ({ name: n, status: "active", studentCount: 0 })),
  });

  const populated = await Batch.findById(batch._id)
    .populate("departmentId", "name code")
    .populate("disciplineId", "name code")
    .lean();

  res.status(201).json(new ApiResponse(201, {
    batch: populated,
    sections: sectionNames,
    message: `Batch created with ${sectionNames.length} section(s). Upload student rosters per section next.`,
  }, "Batch shell created successfully"));
});

// @desc    Upload students for a specific section (per-section Excel upload)
// @route   POST /api/v2/academic/batch/:batchId/section/:sectionName/upload
// @access  Admin
export const uploadSectionStudents = asyncHandler(async (req, res) => {
  const { batchId, sectionName } = req.params;

  // 1. Validate batch & section exist
  const batch = await Batch.findById(batchId)
    .populate("departmentId", "_id name")
    .populate("disciplineId", "_id name code");
  if (!batch) throw new ApiError(404, "Batch not found");
  if (!batch.isActive) throw new ApiError(400, "Cannot upload to an inactive batch");

  const sectionDoc = batch.sections.find(
    s => s.name.toUpperCase() === sectionName.toUpperCase()
  );
  if (!sectionDoc) {
    throw new ApiError(404, `Section "${sectionName}" does not exist in this batch`);
  }

  // 2. Parse Excel file
  if (!req.file) throw new ApiError(400, "Excel file is required");

  const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  if (!rows || rows.length === 0) {
    throw new ApiError(400, "Excel file is empty or has no data rows");
  }

  // 3. Flexible column detection
  const actualCols = Object.keys(rows[0]);
  const findCol = (candidates) => actualCols.find(c => candidates.includes(c.trim().toLowerCase()));
  
  const nameCol = findCol(["name", "student name", "student_name"]);
  const userCol = findCol(["username", "user name", "user_name", "reg no", "reg_no", "registration no"]);
  const rollCol = findCol(["roll no", "roll_no", "rollno", "roll number", "roll_number"]) || userCol;

  if (!nameCol || !userCol) {
    throw new ApiError(400, 'Missing required columns: Excel must have "Name" and "Username" (or "Reg No")');
  }

  // 4. Hash default password
  const defaultPasswordHash = await bcrypt.hash(
    process.env.DEFAULT_STUDENT_PASSWORD || "password123",
    10
  );

  const emailDomain = process.env.INSTITUTION_EMAIL_DOMAIN || "csit-ams.edu";

  // 5. Build user documents
  const userDocs = rows.map(row => {
    const rawUsername = row[userCol]?.toString().trim() || "";
    const rawName = row[nameCol]?.toString().trim() || "";
    const rawRollNo = row[rollCol]?.toString().trim() || rawUsername;
    return {
      username: rawUsername,
      name: rawName,
      email: `${rawUsername.toLowerCase()}@${emailDomain}`,
      password: defaultPasswordHash,
      role: "student",
      accountStatus: "Active",
      mustChangePassword: true,
      info: {
        rollNo: rawRollNo,
        section: sectionDoc.name,
        semester: batch.currentSemester,
        batchId: batch._id,
        departmentId: batch.departmentId._id,
        disciplineId: batch.disciplineId._id,
      },
    };
  }).filter(u => u.username && u.name);

  if (userDocs.length === 0) {
    throw new ApiError(400, "No valid student rows found in Excel file");
  }

  // 6. Separate into new vs existing students by username or email
  const usernames = userDocs.map(u => u.username);
  const emails = userDocs.map(u => u.email);

  const existingUsers = await User.find({
    $or: [{ username: { $in: usernames } }, { email: { $in: emails } }]
  });

  const existingByUsername = new Map(existingUsers.map(u => [u.username.toLowerCase(), u]));
  const existingByEmail = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));

  const toInsert = [];
  const toUpdate = [];

  for (const doc of userDocs) {
    const existing = existingByUsername.get(doc.username.toLowerCase()) || existingByEmail.get(doc.email.toLowerCase());
    if (existing) {
      toUpdate.push({ existingId: existing._id, doc });
    } else {
      toInsert.push(doc);
    }
  }

  // 7. Insert new students
  let insertedCount = 0;
  if (toInsert.length > 0) {
    try {
      const inserted = await User.insertMany(toInsert, { ordered: false });
      insertedCount = inserted.length;
    } catch (err) {
      if (err.code === 11000 || err.name === "MongoBulkWriteError") {
        insertedCount = err.insertedDocs?.length || (toInsert.length - (err.writeErrors?.length || 0));
      } else {
        throw err;
      }
    }
  }

  // 8. Update / reassign existing students to this section and batch
  let updatedCount = 0;
  if (toUpdate.length > 0) {
    const bulkOps = toUpdate.map(({ existingId, doc }) => ({
      updateOne: {
        filter: { _id: existingId },
        update: {
          $set: {
            name: doc.name,
            accountStatus: "Active",
            "info.rollNo": doc.info.rollNo,
            "info.section": sectionDoc.name,
            "info.semester": batch.currentSemester,
            "info.batchId": batch._id,
            "info.departmentId": batch.departmentId._id,
            "info.disciplineId": batch.disciplineId._id,
          }
        }
      }
    }));
    const bulkRes = await User.bulkWrite(bulkOps, { ordered: false });
    updatedCount = bulkRes.modifiedCount || toUpdate.length;
  }

  // 9. Synchronize section student count accurately
  const sectionStudentCount = await User.countDocuments({
    "info.batchId": batchId,
    "info.section": sectionDoc.name,
    role: "student",
  });

  await Batch.updateOne(
    { _id: batchId, "sections._id": sectionDoc._id },
    { $set: { "sections.$.studentCount": sectionStudentCount } }
  );

  const totalProcessed = insertedCount + updatedCount;
  const message = insertedCount > 0 && updatedCount > 0
    ? `${totalProcessed} students processed for section ${sectionDoc.name} (${insertedCount} new, ${updatedCount} existing linked).`
    : insertedCount > 0
    ? `${insertedCount} students uploaded to section ${sectionDoc.name} successfully.`
    : `${updatedCount} existing student accounts linked to section ${sectionDoc.name} successfully.`;

  res.status(200).json(new ApiResponse(200, {
    batchId,
    sectionName: sectionDoc.name,
    totalRows: rows.length,
    inserted: insertedCount,
    updated: updatedCount,
    sectionStudentCount,
  }, message));
});

// @desc    Add a new section to an existing batch (mid-batch, for transfers/migrants)
// @route   POST /api/v2/academic/batch/:id/section
// @access  Admin
export const addBatchSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) throw new ApiError(400, "Section name is required");
  const sectionName = name.trim();

  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");
  if (!batch.isActive) throw new ApiError(400, "Cannot modify an inactive batch");

  const exists = batch.sections.some(
    s => s.name.toUpperCase() === sectionName.toUpperCase()
  );
  if (exists) throw new ApiError(409, `Section "${sectionName}" already exists in this batch`);

  batch.sections.push({ name: sectionName, status: "active", studentCount: 0 });
  await batch.save();

  // Push new empty section into all active CourseAllocations for this batch
  await CourseAllocation.updateMany(
    { batchId: id, isActive: true },
    {
      $push: {
        sections: {
          name: sectionName,
          teacherId: null,
          students: [],
          allowRetroactiveSessions: false,
        }
      }
    }
  );

  const newSection = batch.sections[batch.sections.length - 1];
  res.status(201).json(new ApiResponse(201, {
    section: newSection,
    batchId: id,
  }, `Section "${sectionName}" added successfully`));
});

// @desc    Delete an empty section from a batch
// @route   DELETE /api/v2/academic/batch/:id/section/:sectionName
// @access  Admin
export const deleteBatchSection = asyncHandler(async (req, res) => {
  const { id, sectionName } = req.params;

  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");

  const sectionDoc = batch.sections.find(
    s => s.name.toUpperCase() === sectionName.toUpperCase()
  );
  if (!sectionDoc) throw new ApiError(404, `Section "${sectionName}" not found`);

  if (sectionDoc.studentCount > 0) {
    throw new ApiError(400,
      `Cannot delete section "${sectionName}" — it still has ${sectionDoc.studentCount} student(s). Transfer or remove students first.`
    );
  }

  batch.sections = batch.sections.filter(
    s => s.name.toUpperCase() !== sectionName.toUpperCase()
  );
  await batch.save();

  // Remove from all CourseAllocations
  await CourseAllocation.updateMany(
    { batchId: id },
    { $pull: { sections: { name: { $regex: new RegExp(`^${sectionName}$`, "i") } } } }
  );

  res.status(200).json(new ApiResponse(200, { batchId: id, sectionName },
    `Section "${sectionName}" deleted successfully`));
});

// @desc    Archive or restore a section (archived = grayed out for teacher, no new sessions)
// @route   PATCH /api/v2/academic/batch/:id/section/:sectionName/archive
// @access  Admin
export const archiveBatchSection = asyncHandler(async (req, res) => {
  const { id, sectionName } = req.params;
  const { archive = true } = req.body;

  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");

  const sectionIdx = batch.sections.findIndex(
    s => s.name.toUpperCase() === sectionName.toUpperCase()
  );
  if (sectionIdx === -1) throw new ApiError(404, `Section "${sectionName}" not found`);

  batch.sections[sectionIdx].status = archive ? "archived" : "active";
  await batch.save();

  const action = archive ? "archived" : "restored";
  res.status(200).json(new ApiResponse(200, {
    section: batch.sections[sectionIdx],
    batchId: id,
  }, `Section "${sectionName}" ${action} successfully`));
});


// @desc    Assign subject and teacher to sections
// @route   POST /api/v2/academic/allocation/assign
// @access  Admin
export const allocateCourse = asyncHandler(async (req, res) => {
  const { batchId, teacherAssignments } = req.body;
  // teacherAssignments: [{ subjectId, sections: [{ name: "A", teacherId }] }]

  const batch = await Batch.findById(batchId);
  if (!batch) throw new ApiError(404, "Batch not found");
  if (!batch.isActive) throw new ApiError(400, "Batch is not active");

  const currentSemester = batch.currentSemester;

  // NOTE: Syllabus gate removed — any subject can be allocated to any batch.
  // Per-batch subject selection is managed via setBatchSubjects (GET/POST /batch/:id/subjects).

  const createdAllocations = [];

  for (const assignment of teacherAssignments) {
    const { subjectId, sections } = assignment;

    // Use the sections provided by the admin (active sections from the batch)
    const currentSections = sections && sections.length > 0
      ? sections
      : batch.sections.filter(s => s.status === "active").map(s => ({ name: s.name }));

    if (!currentSections || currentSections.length === 0) {
      throw new ApiError(400, "No sections provided and batch has no active sections.");
    }

    // Verify all teachers exist
    const teacherIds = currentSections.map(s => s.teacherId).filter(Boolean);
    if (teacherIds.length > 0) {
      const teachers = await User.find({ _id: { $in: teacherIds }, role: "teacher", accountStatus: "Active" });
      if (teachers.length !== Array.from(new Set(teacherIds.map(String))).length) {
        throw new ApiError(400, "One or more teachers are invalid or inactive");
      }
    }

    // Fetch students to populate the section's students array
    const populatedSections = [];
    for (const sec of currentSections) {
      const students = await User.find({
        "info.batchId": batch._id,
        "info.section": sec.name,
        role: "student",
        accountStatus: "Active"
      }).select("_id");

      populatedSections.push({
        name: sec.name,
        teacherId: sec.teacherId || null,
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

// @desc    Get per-batch subject list for current semester (with discipline syllabus as fallback)
// @route   GET /api/v2/academic/batch/:id/subjects
// @access  Admin
export const getBatchSubjects = asyncHandler(async (req, res) => {
  const batch = await Batch.findById(req.params.id)
    .populate({
      path: "semesterSubjects.subjects",
      select: "name code creditHours"
    })
    .populate({
      path: "disciplineId",
      select: "name code syllabus",
      populate: { path: "syllabus.subjects", select: "name code creditHours" }
    })
    .lean();

  if (!batch) throw new ApiError(404, "Batch not found");

  // Try per-batch override first, else fall back to discipline syllabus
  const batchOverride = batch.semesterSubjects?.find(
    s => s.semester === batch.currentSemester
  );
  const disciplineFallback = batch.disciplineId?.syllabus?.find(
    s => s.semester === batch.currentSemester
  );

  const source = batchOverride ? "batch" : "discipline";
  const subjects = batchOverride?.subjects || disciplineFallback?.subjects || [];

  res.status(200).json(new ApiResponse(200, {
    semester: batch.currentSemester,
    source,
    subjects,
  }, "Batch subjects retrieved"));
});

// @desc    Set per-batch subjects for current semester (overrides discipline syllabus)
// @route   POST /api/v2/academic/batch/:id/subjects
// @access  Admin
export const setBatchSubjects = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subjectIds, semester } = req.body;

  if (!Array.isArray(subjectIds)) {
    throw new ApiError(400, "subjectIds must be an array");
  }

  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");

  const targetSemester = semester || batch.currentSemester;

  // Remove existing override for this semester, then set new one
  batch.semesterSubjects = [
    ...(batch.semesterSubjects || []).filter(s => s.semester !== targetSemester),
    { semester: targetSemester, subjects: subjectIds }
  ];

  await batch.save();

  const populated = await Batch.findById(id)
    .populate("semesterSubjects.subjects", "name code creditHours")
    .lean();

  const updated = populated.semesterSubjects.find(s => s.semester === targetSemester);

  res.status(200).json(new ApiResponse(200, {
    semester: targetSemester,
    subjects: updated?.subjects || [],
  }, "Batch subjects updated successfully"));
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

  // 1. Soft-delete: mark as inactive instead of hard-deleting to preserve attendance history
  await CourseAllocation.updateMany(
    { batchId: id, semester: currentSem },
    { $set: { isActive: false } }
  );

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

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [allocations, total] = await Promise.all([
    CourseAllocation.find(query)
      .populate("subjectId", "name code creditHours")
      .populate("batchId", "name semester academicYear")
      .populate("sections.teacherId", "name username")
      .populate({
        path: "sections.students",
        select: "name info.rollNo"
      })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseAllocation.countDocuments(query)
  ]);

  res.status(200).json(new ApiResponse(200, {
    allocations,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  }, "Allocations retrieved successfully"));
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
  // Single aggregation: count all present records grouped by allocationId
  const attendanceCounts = await Attendance.aggregate([
    {
      $match: {
        studentId: req.user._id,
        allocationId: { $in: allocations.map(a => a._id) },
        section: section,
        status: { $in: ["Present", "Present (Manual)", "Late"] }
      }
    },
    { $group: { _id: "$allocationId", presentCount: { $sum: 1 } } }
  ]);

  // Single aggregation: count all sessions grouped by allocationId
  const sessionCounts = await Session.aggregate([
    {
      $match: {
        allocationId: { $in: allocations.map(a => a._id) },
        sectionName: section
      }
    },
    { $group: { _id: "$allocationId", totalSessions: { $sum: 1 } } }
  ]);

  const attendanceMap = {};
  attendanceCounts.forEach(a => { attendanceMap[a._id.toString()] = a.presentCount; });
  const sessionMap = {};
  sessionCounts.forEach(s => { sessionMap[s._id.toString()] = s.totalSessions; });

  const currentSubjects = allocations.map(alloc => {
    const sec = alloc.sections.find(s => s.name === section);
    const presentCount = attendanceMap[alloc._id.toString()] || 0;
    const totalSessions = sessionMap[alloc._id.toString()] || 0;
    return {
      id: alloc._id,
      subjectId: alloc.subjectId._id,
      name: alloc.subjectId.name,
      code: alloc.subjectId.code,
      creditHours: alloc.subjectId.creditHours,
      teacher: sec?.teacherId?.name || "Unknown",
      present: presentCount,
      total: totalSessions
    };
  });

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
      status: { $in: ["Present", "Present (Manual)", "Late"] }
    });

    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
    
    const threshold = await getSystemSetting("attendanceThreshold", 75);
    // Status based on dynamic attendance rule
    let status = percentage >= threshold ? "Cleared" : "Barred";

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
    .populate("subjectId", "name code creditHours")
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
        creditHours: alloc.subjectId?.creditHours || null,
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

  const sessionIds = sessions.map(s => s._id);

  // Get present counts for all sessions in one query
  const presentCounts = await Attendance.aggregate([
    {
      $match: {
        sessionId: { $in: sessionIds },
        status: { $in: ["Present", "Present (Manual)", "Late"] }
      }
    },
    { $group: { _id: "$sessionId", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  presentCounts.forEach(pc => { countMap[pc._id.toString()] = pc.count; });

  const pastClasses = sessions.map(sess => {
    let total = 0;
    if (sess.allocationId) {
      const sec = sess.allocationId.sections?.find(s => s.name === sess.sectionName);
      if (sec) total = sec.students.length;
    }
    return {
      _id: sess._id,
      allocationId: sess.allocationId?._id || sess.allocationId,
      subject: sess.allocationId?.subjectId?.name || "Unknown",
      section: sess.sectionName,
      date: new Date(sess.startTime).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' }),
      type: sess.type,
      present: countMap[sess._id.toString()] || 0,
      total
    };
  });

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

  const sessionIds = rawSessions.map(s => s._id);
  const sessionPresentCounts = await Attendance.aggregate([
    {
      $match: {
        sessionId: { $in: sessionIds },
        status: { $in: ["Present", "Present (Manual)", "Late"] }
      }
    },
    { $group: { _id: "$sessionId", count: { $sum: 1 } } }
  ]);
  const sessionCountMap = {};
  sessionPresentCounts.forEach(pc => { sessionCountMap[pc._id.toString()] = pc.count; });

  const sessions = rawSessions.map((sess) => ({
    _id: sess._id,
    date: new Date(sess.startTime).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' }),
    type: sess.type || "Lecture",
    present: sessionCountMap[sess._id.toString()] || 0,
    total: section.students.length
  }));

  // Get present counts for ALL students in one query
  const studentIds = section.students.map(s => s._id);
  const presentCounts = await Attendance.aggregate([
    {
      $match: {
        allocationId: new mongoose.Types.ObjectId(allocationId),
        section: sectionName,
        studentId: { $in: studentIds },
        status: { $in: ["Present", "Present (Manual)", "Late"] }
      }
    },
    { $group: { _id: "$studentId", count: { $sum: 1 } } }
  ]);
  // Get ALL attendance records for this class to build the matrix
  const allAttendance = await Attendance.find({
    allocationId: new mongoose.Types.ObjectId(allocationId),
    section: sectionName,
    studentId: { $in: studentIds }
  }).lean();

  const attendanceMap = new Map();
  allAttendance.forEach(att => {
    const key = `${att.studentId.toString()}_${att.sessionId.toString()}`;
    attendanceMap.set(key, att);
  });

  const countMap = {};
  presentCounts.forEach(pc => { countMap[pc._id.toString()] = pc.count; });

  const students = section.students.map(student => {
    const studentSessionRecords = rawSessions.map(sess => {
      const att = attendanceMap.get(`${student._id.toString()}_${sess._id.toString()}`);
      return {
        date: sess.startTime,
        status: att ? att.status : (sess.active ? "Not Scanned" : "Absent")
      };
    });

    return {
      id: student._id,
      name: student.name,
      rollNo: student.info?.rollNo,
      present: countMap[student._id.toString()] || 0,
      total: totalSessions,
      sessionRecords: studentSessionRecords
    };
  });

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
      status: { $in: ["Present", "Present (Manual)", "Late"] }
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

  const presentCount = report.filter(r => ["Present", "Present (Manual)", "Late"].includes(r.status)).length;
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
        sec.students.pull(id);
      }
    }

    // Add to new section
    for (const sec of alloc.sections) {
      if (sec.name === newSection) {
        if (!sec.students.includes(id)) {
          sec.students.push(id);
        }
        studentMoved = true;
      }
    }

    if (studentMoved) {
      alloc.markModified("sections");
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

  const presentCount = sessionList.filter(s => ["Present", "Present (Manual)", "Late"].includes(s.status)).length;

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

// @desc    Mark a batch as completed (soft close — hides from allocation, keeps data)
// @route   POST /api/v2/academic/batch/:id/complete
// @access  Admin
export const completeBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");
  if (!batch.isActive) throw new ApiError(400, "Batch is already inactive or completed");

  // Soft close
  batch.isActive = false;
  batch.currentSemester = 0; // 0 = graduated marker
  await batch.save();

  // Deactivate all CourseAllocations for this batch
  const allocResult = await CourseAllocation.updateMany(
    { batchId: id, isActive: true },
    { $set: { isActive: false } }
  );

  res.status(200).json(new ApiResponse(200, {
    batchId: id,
    batchName: batch.name,
    allocationsDeactivated: allocResult.modifiedCount,
  }, `Batch "${batch.name}" marked as completed. Data is preserved and visible in reports.`));
});

// @desc    Hard delete a batch and all its cascading data
// @route   DELETE /api/v2/academic/batch/:id
// @access  Admin
// Guard: batch must be inactive (completed) OR have no allocations/sessions at all (empty batch)
export const deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { confirmName } = req.body;

  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");

  // Safety: require the admin to confirm with the batch name
  if (!confirmName || confirmName.trim() !== batch.name) {
    throw new ApiError(400,
      `Confirmation failed. You must provide the exact batch name "${batch.name}" to delete it.`
    );
  }

  // Guard: batch must be completed (isActive=false), OR be an empty batch (no allocations, no sessions)
  if (batch.isActive) {
    const allocCount = await CourseAllocation.countDocuments({ batchId: id });
    const sessionCount = await Session.countDocuments({ batchId: id });

    if (allocCount > 0 || sessionCount > 0) {
      throw new ApiError(400,
        "Cannot delete an active batch that has allocations or sessions. Mark it as completed first."
      );
    }
    // Empty active batch — allowed to delete directly
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  let deleted = { students: 0, allocations: 0, sessions: 0, attendance: 0 };

  try {
    // 1. Get all allocation IDs for this batch
    const allocationIds = await CourseAllocation.distinct("_id", { batchId: id });

    // 2. Get all session IDs for those allocations
    const sessionIds = await Session.distinct("_id", { allocationId: { $in: allocationIds } });

    // 3. Delete Attendance records
    const attRes = await Attendance.deleteMany(
      { sessionId: { $in: sessionIds } },
      { session: dbSession }
    );
    deleted.attendance = attRes.deletedCount;

    // 4. Delete Sessions
    const sessRes = await Session.deleteMany(
      { allocationId: { $in: allocationIds } },
      { session: dbSession }
    );
    deleted.sessions = sessRes.deletedCount;

    // 5. Delete CourseAllocations
    const allocRes = await CourseAllocation.deleteMany(
      { batchId: id },
      { session: dbSession }
    );
    deleted.allocations = allocRes.deletedCount;

    // 6. Delete Student User accounts in this batch
    const studentRes = await User.deleteMany(
      { role: "student", "info.batchId": id },
      { session: dbSession }
    );
    deleted.students = studentRes.deletedCount;

    // 7. Delete the Batch document itself
    await Batch.deleteOne({ _id: id }, { session: dbSession });

    await dbSession.commitTransaction();
  } catch (err) {
    await dbSession.abortTransaction();
    throw err;
  } finally {
    dbSession.endSession();
  }

  res.status(200).json(new ApiResponse(200, {
    batchId: id,
    batchName: batch.name,
    deleted,
  }, `Batch "${batch.name}" and all associated data permanently deleted.`));
});

