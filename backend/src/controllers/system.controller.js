import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Department from "../models/department.model.js";
import Subject from "../models/subject.model.js";
import Discipline from "../models/discipline.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";
// import { sendTeacherWelcome } from "../utils/sendEmail.js";

// @desc    Create a new department
// @route   POST /api/v2/system/department
// @access  Admin
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    throw new ApiError(400, "Department name and code are required");
  }

  const existingDept = await Department.findOne({ code: code.toUpperCase() });
  if (existingDept) {
    throw new ApiError(409, "Department with this code already exists");
  }

  const department = await Department.create({
    name,
    code: code.toUpperCase(),
  });

  res.status(201).json(new ApiResponse(201, department, "Department created successfully"));
});

// @desc    Get all departments
// @route   GET /api/v2/system/departments
// @access  Admin
export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 }).lean();
  res.status(200).json(new ApiResponse(200, departments, "Departments retrieved successfully"));
});

// @desc    Delete a department
// @route   DELETE /api/v2/system/department/:id
// @access  Admin
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if any Disciplines reference this dept
  const disciplineCount = await Discipline.countDocuments({ departmentId: id });
  if (disciplineCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${disciplineCount} discipline(s) are linked to this department.`
    );
  }

  const department = await Department.findByIdAndDelete(id);
  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  res.status(200).json(new ApiResponse(200, null, "Department deleted successfully"));
});

// @desc    Update a department
// @route   PUT /api/v2/system/department/:id
// @access  Admin
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code } = req.body;

  const department = await Department.findById(id);
  if (!department) throw new ApiError(404, "Department not found");

  if (code && code.toUpperCase() !== department.code) {
    const existing = await Department.findOne({ code: code.toUpperCase() });
    if (existing) throw new ApiError(409, "Department code already exists");
    department.code = code.toUpperCase();
  }
  if (name) department.name = name;

  await department.save();
  res.status(200).json(new ApiResponse(200, department, "Department updated successfully"));
});



// @desc    Create a new subject
// @route   POST /api/v2/system/subject
// @access  Admin
export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, creditHours, departmentId } = req.body;

  if (!name || !code || !creditHours || !departmentId) {
    throw new ApiError(400, "Name, code, creditHours, and departmentId are required");
  }

  const dept = await Department.findById(departmentId);
  if (!dept) {
    throw new ApiError(404, "Department not found");
  }

  const existingSubject = await Subject.findOne({ code: code.toUpperCase() });
  if (existingSubject) {
    throw new ApiError(409, "Subject with this code already exists");
  }

  const subject = await Subject.create({
    name,
    code: code.toUpperCase(),
    creditHours,
    departmentId,
  });

  res.status(201).json(new ApiResponse(201, subject, "Subject created successfully"));
});

// @desc    Get all subjects
// @route   GET /api/v2/system/subjects
// @access  Admin
export const getSubjects = asyncHandler(async (req, res) => {
  const { departmentId, isArchived } = req.query;

  const query = {};
  if (departmentId) query.departmentId = departmentId;
  if (isArchived) query.isArchived = isArchived === "true";

  const subjects = await Subject.find(query)
    .populate("departmentId", "name code")
    .sort({ code: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, subjects, "Subjects retrieved successfully"));
});

// @desc    Update a subject
// @route   PUT /api/v2/system/subject/:id
// @access  Admin
export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, creditHours, departmentId } = req.body;

  const subject = await Subject.findById(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  if (code && code.toUpperCase() !== subject.code) {
    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) throw new ApiError(409, "Subject code already exists");
    subject.code = code.toUpperCase();
  }
  if (name) subject.name = name;
  if (creditHours) subject.creditHours = creditHours;
  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) throw new ApiError(404, "Department not found");
    subject.departmentId = departmentId;
  }

  await subject.save();
  res.status(200).json(new ApiResponse(200, subject, "Subject updated successfully"));
});

// @desc    Delete a subject
// @route   DELETE /api/v2/system/subject/:id
// @access  Admin
export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findByIdAndDelete(id);
  if (!subject) throw new ApiError(404, "Subject not found");

  res.status(200).json(new ApiResponse(200, null, "Subject deleted successfully"));
});

// @desc    Create a new discipline
// @route   POST /api/v2/system/discipline
// @access  Admin
export const createDiscipline = asyncHandler(async (req, res) => {
  const { name, code, departmentId, totalSemesters } = req.body;

  if (!name || !code || !departmentId) {
    throw new ApiError(400, "Name, code, and departmentId are required");
  }

  const existingDiscipline = await Discipline.findOne({ code: code.toUpperCase() });
  if (existingDiscipline) {
    throw new ApiError(409, "Discipline with this code already exists");
  }

  const dept = await Department.findById(departmentId);
  if (!dept) {
    throw new ApiError(404, "Department not found");
  }

  const discipline = await Discipline.create({
    name,
    code: code.toUpperCase(),
    departmentId,
    totalSemesters: totalSemesters || 8,
    syllabus: [],
  });

  res.status(201).json(new ApiResponse(201, discipline, "Discipline created successfully"));
});

// @desc    Update a discipline
// @route   PUT /api/v2/system/discipline/:id
// @access  Admin
export const updateDiscipline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, totalSemesters, departmentId } = req.body;

  const discipline = await Discipline.findById(id);
  if (!discipline) throw new ApiError(404, "Discipline not found");

  if (code && code.toUpperCase() !== discipline.code) {
    const existing = await Discipline.findOne({ code: code.toUpperCase() });
    if (existing) throw new ApiError(409, "Discipline code already exists");
    discipline.code = code.toUpperCase();
  }
  if (name) discipline.name = name;
  if (totalSemesters) discipline.totalSemesters = totalSemesters;
  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) throw new ApiError(404, "Department not found");
    discipline.departmentId = departmentId;
  }

  await discipline.save();
  res.status(200).json(new ApiResponse(200, discipline, "Discipline updated successfully"));
});

// @desc    Delete a discipline
// @route   DELETE /api/v2/system/discipline/:id
// @access  Admin
export const deleteDiscipline = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const discipline = await Discipline.findByIdAndDelete(id);
  if (!discipline) throw new ApiError(404, "Discipline not found");

  res.status(200).json(new ApiResponse(200, null, "Discipline deleted successfully"));
});

// @desc    Update discipline syllabus (Curriculum Builder)
// @route   PUT /api/v2/system/discipline/:id/syllabus
// @access  Admin
export const updateSyllabus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { syllabus } = req.body;

  if (!Array.isArray(syllabus)) {
    throw new ApiError(400, "Syllabus must be an array");
  }

  const discipline = await Discipline.findById(id);
  if (!discipline) {
    throw new ApiError(404, "Discipline not found");
  }

  const subjectIds = new Set();
  for (const sem of syllabus) {
    if (!sem.semester || sem.semester < 1 || sem.semester > discipline.totalSemesters) {
      throw new ApiError(400, `Invalid semester number: ${sem.semester}`);
    }
    if (Array.isArray(sem.subjects)) {
      for (const subId of sem.subjects) {
        if (subjectIds.has(subId.toString())) {
          throw new ApiError(400, `Duplicate subject in syllabus: ${subId}`);
        }
        subjectIds.add(subId.toString());
      }
    }
  }

  // Validate all subjects exist and are not archived
  const subjects = await Subject.find({ _id: { $in: Array.from(subjectIds) } });
  if (subjects.length !== subjectIds.size) {
    throw new ApiError(400, "One or more subjects do not exist");
  }

  const archivedSubjects = subjects.filter(s => s.isArchived);
  if (archivedSubjects.length > 0) {
    throw new ApiError(400, "Cannot add archived subjects to syllabus");
  }

  const updatedDiscipline = await Discipline.findByIdAndUpdate(
    id,
    { syllabus },
    { new: true }
  ).populate("syllabus.subjects", "name code creditHours");

  res.status(200).json(new ApiResponse(200, updatedDiscipline, "Syllabus updated successfully"));
});

// @desc    Create a new teacher account
// @route   POST /api/v2/system/teacher
// @access  Admin
export const createTeacher = asyncHandler(async (req, res) => {
  const { name, username, departmentId, phone } = req.body;

  if (!name || !username || !departmentId) {
    throw new ApiError(400, "Name, username (Employee ID), and departmentId are required");
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new ApiError(409, "User with this username/Employee ID already exists");
  }

  const dept = await Department.findById(departmentId);
  if (!dept) {
    throw new ApiError(404, "Department not found");
  }

  // Use environment variable for default teacher password, fallback to 'password123'
  const tempPassword = process.env.DEFAULT_TEACHER_PASSWORD || "password123";

  // Create a placeholder email based on username if email is missing (assuming required by schema)
  // The user will change it on first login setup
  const email = `${username.toLowerCase()}@csit-ams.edu`;

  const teacher = await User.create({
    name,
    username,
    email,
    password: tempPassword,
    role: "teacher",
    accountStatus: "Active",
    mustChangePassword: true,
    info: {
      departmentId,
      phone,
    },
  });

  // TODO: Send email
  // await sendTeacherWelcome(teacher, tempPassword);

  const teacherResponse = teacher.toObject();
  delete teacherResponse.password;

  res.status(201).json(new ApiResponse(201, teacherResponse, "Teacher created successfully. Credentials generated."));
});

// @desc    Get subject by ID
// @route   GET /api/v2/system/subject/:id
// @access  Admin
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id).populate("departmentId", "name code").lean();
  if (!subject) throw new ApiError(404, "Subject not found");
  res.status(200).json(new ApiResponse(200, subject, "Subject retrieved successfully"));
});

// @desc    Get all disciplines
// @route   GET /api/v2/system/disciplines
// @access  Admin
export const getDisciplines = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const query = {};
  if (departmentId) query.departmentId = departmentId;
  
  const disciplines = await Discipline.find(query)
    .populate("departmentId", "name code")
    .sort({ code: 1 })
    .lean();
  res.status(200).json(new ApiResponse(200, disciplines, "Disciplines retrieved successfully"));
});

// @desc    Get syllabus
// @route   GET /api/v2/system/discipline/:id/syllabus
// @access  Admin
export const getSyllabus = asyncHandler(async (req, res) => {
  const discipline = await Discipline.findById(req.params.id)
    .populate("syllabus.subjects", "name code creditHours")
    .lean();
    
  if (!discipline) throw new ApiError(404, "Discipline not found");
  res.status(200).json(new ApiResponse(200, discipline.syllabus, "Syllabus retrieved successfully"));
});
