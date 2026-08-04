import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Subject from "../models/subject.model.js";
import DeviceResetLog from "../models/deviceResetLog.model.js";
import bcrypt from "bcryptjs";
import EmailService from "../services/email.service.js"; // To be created

// @desc    Nullify device fingerprint lock
// @route   PATCH /api/v2/admin/users/:id/reset-device
// @access  Admin
export const resetDevice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) throw new ApiError(404, "User not found");

  const previousDeviceId = user.deviceId;
  user.deviceId = null;
  await user.save({ validateBeforeSave: false });

  await DeviceResetLog.create({
    studentId: user._id,
    adminId: req.user._id,
    previousDeviceId: previousDeviceId || "Unknown",
    reason: req.body.reason || "Admin override",
  });

  try {
    await EmailService.sendDeviceAlert(user, "reset", null);
  } catch (err) {
    console.error("Failed to send device reset email", err);
  }

  res.status(200).json(new ApiResponse(200, {}, "Device fingerprint reset successfully"));
});

// @desc    Force revert to default password + set mustChangePassword flag
// @route   PATCH /api/v2/admin/users/:id/reset-password
// @access  Admin
export const resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) throw new ApiError(404, "User not found");

  const hashedDefault = await bcrypt.hash(
    process.env.DEFAULT_STUDENT_PASSWORD || "password123", 10
  );

  await User.findByIdAndUpdate(id, {
    password: hashedDefault,
    mustChangePassword: true,
    $unset: { refreshToken: 1 }, // invalidate all sessions
  });

  res.status(200).json(new ApiResponse(200, {}, "Password reset to default successfully. User will be forced to change it on next login."));
});

// @desc    Moves a student to a different section within the same batch, or to a different discipline/batch entirely.
// @route   PUT /api/v2/admin/users/:id/transfer
// @access  Admin
export const transferStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { targetBatchId, targetDisciplineId, targetSection } = req.body;

  const user = await User.findById(id);
  if (!user || user.role !== "student") {
    throw new ApiError(404, "Student not found");
  }

  const oldBatchId = user.info.batchId;
  const oldSection = user.info.section;

  // 1. Update user info
  if (targetBatchId) user.info.batchId = targetBatchId;
  if (targetDisciplineId) user.info.disciplineId = targetDisciplineId;
  if (targetSection) user.info.section = targetSection;
  // If moving batches, semester should probably be synced too, but for simplicity assuming intra-batch or similar level

  await user.save({ validateBeforeSave: false });

  // 2. Update CourseAllocation sections arrays
  if (oldBatchId && oldSection) {
    // Remove from old section
    await CourseAllocation.updateMany(
      { batchId: oldBatchId, "sections.name": oldSection },
      { $pull: { "sections.$.students": id } }
    );
  }

  if (targetBatchId || user.info.batchId) {
    const newBatchId = targetBatchId || user.info.batchId;
    const newSection = targetSection || user.info.section;
    // Add to new section
    await CourseAllocation.updateMany(
      { batchId: newBatchId, "sections.name": newSection },
      { $addToSet: { "sections.$.students": id } }
    );
  }

  res.status(200).json(new ApiResponse(200, user, "Student transferred successfully"));
});

// @desc    Deactivate teacher account and return active allocations requiring reassignment
// @route   POST /api/v2/admin/teacher/:id/offboard
// @access  Admin
export const offboardTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacher = await User.findById(id);

  if (!teacher || teacher.role !== "teacher") {
    throw new ApiError(404, "Teacher not found");
  }

  // Find active allocations where this teacher is assigned
  const activeAllocations = await CourseAllocation.find({
    "sections.teacherId": id,
    isActive: true,
  }).populate("subjectId", "name code").populate("batchId", "name");

  // Deactivate teacher account
  teacher.accountStatus = "Inactive";
  await teacher.save({ validateBeforeSave: false });

  // Invalidate all tokens
  await User.findByIdAndUpdate(id, { $unset: { refreshToken: 1 } });

  // Return list of active allocations that need reassignment
  res.status(200).json(new ApiResponse(200, {
    offboardedTeacher: { _id: id, name: teacher.name },
    activeAllocationsRequiringReassignment: activeAllocations,
    count: activeAllocations.length,
  }, `Teacher deactivated. ${activeAllocations.length} active section(s) require teacher reassignment.`));
});

// @desc    Reassigns a teacher to a specific section in a CourseAllocation.
// @route   PATCH /api/v2/admin/allocation/:id/reassign-teacher
// @access  Admin
export const reassignTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sectionName, newTeacherId } = req.body;

  if (!sectionName || !newTeacherId) {
    throw new ApiError(400, "sectionName and newTeacherId are required");
  }

  const teacher = await User.findOne({ _id: newTeacherId, role: "teacher", accountStatus: "Active" });
  if (!teacher) {
    throw new ApiError(404, "New teacher not found or inactive");
  }

  const allocation = await CourseAllocation.findOneAndUpdate(
    { _id: id, "sections.name": sectionName },
    { $set: { "sections.$.teacherId": newTeacherId } },
    { new: true }
  );

  if (!allocation) {
    throw new ApiError(404, "Course allocation or section not found");
  }

  res.status(200).json(new ApiResponse(200, allocation, "Teacher reassigned successfully"));
});

// @desc    Toggle archive status of a subject
// @route   PUT /api/v2/admin/subject/:id/archive
// @access  Admin
export const archiveSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentSubject = await Subject.findById(id);

  if (!currentSubject) {
    throw new ApiError(404, "Subject not found");
  }

  const updatedSubject = await Subject.findByIdAndUpdate(
    id, 
    { isArchived: !currentSubject.isArchived },
    { new: true }
  );

  res.status(200).json(new ApiResponse(200, updatedSubject, `Subject ${updatedSubject.isArchived ? 'archived' : 'unarchived'} successfully`));
});

// @desc    Get all users with filtering
// @route   GET /api/v2/admin/users
// @access  Admin
export const getUsers = asyncHandler(async (req, res) => {
  const { role, batchId, section, search, accountStatus, deviceStatus } = req.query;

  const query = {};
  if (role) query.role = role;
  if (batchId) query["info.batchId"] = batchId;
  if (section) query["info.section"] = section;
  if (accountStatus) query.accountStatus = accountStatus;
  
  if (deviceStatus === "bound") query.deviceId = { $ne: null };
  if (deviceStatus === "unbound") query.deviceId = null;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
      { "info.rollNo": { $regex: search, $options: "i" } }
    ];
  }

  const users = await User.find(query)
    .select("-password -refreshToken -twoFactorSecret")
    .populate("info.departmentId", "name code")
    .populate("info.batchId", "name currentSemester")
    .sort({ name: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, users, "Users retrieved successfully"));
});

// @desc    Update user status
// @route   PATCH /api/v2/admin/users/:id/status
// @access  Admin
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accountStatus } = req.body;

  if (!["Active", "Inactive", "Suspended"].includes(accountStatus)) {
    throw new ApiError(400, "Invalid account status");
  }

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  user.accountStatus = accountStatus;
  await user.save({ validateBeforeSave: false });

  // If inactivating/suspending, invalidate sessions
  if (accountStatus !== "Active") {
    await User.findByIdAndUpdate(id, { $unset: { refreshToken: 1 } });
  }

  res.status(200).json(new ApiResponse(200, user, `User status updated to ${accountStatus}`));
});

// @desc    Create a new user manually
// @route   POST /api/v2/admin/users
// @access  Admin
export const createUser = asyncHandler(async (req, res) => {
  const { username, name, email, password, role, info } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, "User already exists with this email");
  }

  const user = await User.create({
    username,
    name,
    email,
    password,
    role,
    info: info || {}
  });

  if (role === "student" && info?.batchId && info?.section) {
    const mongoose = (await import('mongoose')).default;
    await mongoose.model('CourseAllocation').updateMany(
      { batchId: info.batchId, isActive: true, "sections.name": info.section },
      { $addToSet: { "sections.$.students": user._id } }
    );
  }

  const createdUser = await User.findById(user._id).select("-password -twoFactorSecret -refreshToken");

  res.status(201).json(new ApiResponse(201, createdUser, "User created successfully"));
});

// @desc    Update a user details manually
// @route   PUT /api/v2/admin/users/:id
// @access  Admin
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, info } = req.body;

  let user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      throw new ApiError(400, "Email already in use by another user");
    }
    user.email = email;
  }

  if (name) user.name = name;
  if (role) user.role = role;
  if (info) user.info = { ...user.info, ...info };

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select("-password -twoFactorSecret -refreshToken");
  res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

// @desc    Toggle retroactive permission for a specific class/allocation section
// @route   PATCH /api/v2/admin/allocation/:id/retroactive
// @access  Admin
export const toggleRetroactivePermission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sectionName, allowRetroactiveSessions } = req.body;

  const allocation = await CourseAllocation.findOneAndUpdate(
    { _id: id, "sections.name": sectionName },
    { $set: { "sections.$.allowRetroactiveSessions": allowRetroactiveSessions } },
    { new: true }
  );

  if (!allocation) {
    throw new ApiError(404, "Course allocation or section not found");
  }

  res.status(200).json(new ApiResponse(200, allocation, `Retroactive permission ${allowRetroactiveSessions ? 'granted' : 'revoked'}`));
});
