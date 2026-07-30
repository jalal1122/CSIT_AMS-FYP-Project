import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Attendance from "../models/attendance.model.js";
import Session from "../models/session.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import jwt from "jsonwebtoken";
// import { calculateDistance } from "../utils/geolocation.js";

const getClientIP = (req) => {
  return req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.connection?.remoteAddress || req.ip;
};

// @desc    Mark attendance via QR scan
// @route   POST /api/v2/attendance/mark
// @access  Student
export const markAttendance = asyncHandler(async (req, res) => {
  const { qrToken, latitude, longitude } = req.body;
  if (!qrToken) throw new ApiError(400, "QR token is required");

  let decodedToken;
  try {
    decodedToken = jwt.verify(qrToken, process.env.QR_SECRET);
  } catch (error) {
    throw new ApiError(400, "Invalid or expired QR code. Please scan the latest one.");
  }

  const { sessionId, allocationId, sectionName } = decodedToken;

  const session = await Session.findById(sessionId);
  if (!session || !session.active) {
    throw new ApiError(400, "Session is no longer active");
  }

  const allocation = await CourseAllocation.findById(allocationId);
  if (!allocation) throw new ApiError(404, "Allocation not found");

  const section = allocation.sections.find(s => s.name === sectionName);
  const isEnrolled = section?.students.some(id => id.toString() === req.user._id.toString());
  
  if (!isEnrolled) {
    throw new ApiError(403, "You are not enrolled in this section");
  }

  const existingAttendance = await Attendance.findOne({
    sessionId,
    studentId: req.user._id,
  });

  if (existingAttendance) {
    throw new ApiError(409, "You have already marked your attendance for this session");
  }

  const studentIP = getClientIP(req);
  let isSuspicious = false;
  let flagReason = [];
  let distanceFromTeacher = null;

  // Security checks
  if (session.securityConfig.ipMatchEnabled) {
    if (studentIP !== session.teacherIP && studentIP !== "::1" && session.teacherIP !== "::1") {
      isSuspicious = true;
      flagReason.push("IP mismatch");
    }
  }

  // TODO: Add Geolocation checks
  // if (latitude && longitude && session.location?.latitude) {
  //   distanceFromTeacher = calculateDistance(...)
  // }

  const status = session.securityConfig.manualApproval ? "Pending" : "Present";

  const attendance = await Attendance.create({
    sessionId,
    studentId: req.user._id,
    allocationId,
    section: sectionName,
    status,
    verificationMethod: "QR",
    deviceId: req.user.deviceId || "unknown",
    isSuspicious,
    metadata: {
      ipAddress: studentIP,
      distanceFromTeacher,
      flagReason: flagReason.join(", "),
    },
    date: new Date(),
  });

  res.status(201).json(new ApiResponse(201, attendance, `Attendance marked as ${status}`));
});

// @desc    Manual attendance update by teacher
// @route   PUT /api/v2/attendance/:id
// @access  Teacher
export const updateAttendance = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const attendanceId = req.params.id;

  const validStatuses = ["Present", "Absent", "Late", "Leave"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const attendance = await Attendance.findById(attendanceId).populate("sessionId");
  if (!attendance) throw new ApiError(404, "Attendance record not found");

  // Verify ownership
  if (attendance.sessionId.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to modify this session's attendance");
  }

  attendance.status = status;
  // If it was manual override, we clear suspicious flags
  attendance.isSuspicious = false; 
  attendance.metadata.flagReason = "Overridden manually by teacher";
  
  await attendance.save();

  res.status(200).json(new ApiResponse(200, attendance, "Attendance updated successfully"));
});
