import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Attendance from "../models/attendance.model.js";
import Session from "../models/session.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import jwt from "jsonwebtoken";
import { calculateDistance } from "../utils/geolocation.js";
import { emitToSession } from "../services/socket.js";
import { getClientIP } from "../utils/network.js";
import User from "../models/user.model.js";

// @desc    Mark attendance via QR scan
// @route   POST /api/v2/attendance/mark
// @access  Student
export const markAttendance = asyncHandler(async (req, res) => {
  const { qrToken, location, deviceId } = req.body;
  const latitude = location?.latitude;
  const longitude = location?.longitude;
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

  const allocation = await CourseAllocation.findById(allocationId).populate("subjectId", "name");
  if (!allocation) throw new ApiError(404, "Allocation not found");

  const normalizedSectionName = (sectionName || "").trim().toUpperCase();
  const section = allocation.sections.find(
    s => (s.name || "").trim().toUpperCase() === normalizedSectionName
  );
  if (!section) {
    throw new ApiError(404, `Section '${sectionName}' not found in course allocation`);
  }

  // Enrollment verification:
  // 1. Student ID is explicitly present in section.students, OR
  // 2. Student's registered batch and section match this allocation's batch and section
  const isExplicitlyInList = section.students?.some(
    id => id.toString() === req.user._id.toString()
  );

  const studentBatchId = req.user.info?.batchId?.toString();
  const studentSection = (req.user.info?.section || "").trim().toUpperCase();
  const allocationBatchId = allocation.batchId?.toString();

  const isProfileEnrolled = Boolean(
    studentBatchId &&
    allocationBatchId &&
    studentBatchId === allocationBatchId &&
    studentSection === normalizedSectionName
  );

  const isEnrolled = isExplicitlyInList || isProfileEnrolled;
  
  if (!isEnrolled) {
    throw new ApiError(403, "You are not enrolled in this section");
  }

  // Auto-heal: If student belongs to this batch & section but was not yet pushed to section.students, sync them now
  if (!isExplicitlyInList && isProfileEnrolled) {
    CourseAllocation.updateOne(
      { _id: allocation._id, "sections._id": section._id },
      { $addToSet: { "sections.$.students": req.user._id } }
    ).catch(err => console.error("Auto-heal student enrollment in CourseAllocation error:", err));
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

  // Geolocation checks
  if (session.securityConfig.radius > 0) {
    if (!latitude || !longitude) {
      throw new ApiError(400, "Geolocation is required by the teacher for this session.");
    }
    
    if (session.location?.latitude && session.location?.longitude) {
      distanceFromTeacher = calculateDistance(
        latitude, 
        longitude, 
        session.location.latitude, 
        session.location.longitude
      );
      
      if (distanceFromTeacher > session.securityConfig.radius) {
        isSuspicious = true;
        flagReason.push(`Outside geofence (${distanceFromTeacher}m)`);
      }
    }
  }

  const incomingDeviceId = deviceId || "unknown";

  // Auto-bind: if student has no device bound, bind this one NOW
  if (!req.user.deviceId && incomingDeviceId !== "unknown") {
    await User.findByIdAndUpdate(req.user._id, { deviceId: incomingDeviceId });
    // Use the incoming deviceId for the rest of this request
    req.user.deviceId = incomingDeviceId;
  }

  // Anti-Buddy Punching (Device Lock)
  if (session.securityConfig.deviceLockEnabled && incomingDeviceId !== "unknown") {
    // 1. Is the student using a DIFFERENT device than their bound one?
    if (req.user.deviceId && req.user.deviceId !== "unknown" && req.user.deviceId !== incomingDeviceId) {
      isSuspicious = true;
      flagReason.push("Device mismatch (Not student's primary device)");
    }

    // 2. Has this device been used in this specific session by someone else?
    const deviceUsedByOther = await Attendance.findOne({
      sessionId,
      deviceId: incomingDeviceId,
      studentId: { $ne: req.user._id }
    });
    
    if (deviceUsedByOther) {
      isSuspicious = true;
      flagReason.push("Buddy Punching Detected (Shared Device)");
    }
  }

  const status = session.securityConfig.manualApproval ? "Pending" : "Present";

  const attendance = await Attendance.create({
    sessionId,
    studentId: req.user._id,
    allocationId,
    section: sectionName,
    status,
    verificationMethod: "QR",
    deviceId: incomingDeviceId,
    isSuspicious,
    metadata: {
      ipAddress: studentIP,
      distanceFromTeacher,
      flagReason: flagReason.join(", "),
    },
    date: new Date(),
  });

  emitToSession(sessionId.toString(), "attendance:updated", { studentId: req.user._id, status, isSuspicious });

  const responseData = {
    ...attendance.toObject(),
    subjectName: allocation.subjectId.name,
    sectionName: sectionName
  };

  res.status(201).json(new ApiResponse(201, responseData, `Attendance marked as ${status}`));
});

// @desc    Manual attendance update by teacher
// @route   PUT /api/v2/attendance/:id
// @access  Teacher
export const updateAttendance = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const attendanceId = req.params.id;

  const validStatuses = ["Present", "Present (Manual)", "Absent", "Late", "Leave", "Pending"];
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

// @desc    Bulk insert/update attendance for a session
// @route   POST /api/v2/attendance/bulk
// @access  Teacher
export const insertBulkAttendance = asyncHandler(async (req, res) => {
  const { sessionId, attendanceRecords } = req.body;
  
  if (!sessionId || !Array.isArray(attendanceRecords)) {
    throw new ApiError(400, "Session ID and an array of attendance records are required");
  }

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");

  if (session.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized for this session");
  }

  const sessionDate = new Date(session.startTime);
  const startDate = new Date(sessionDate.getFullYear(), 0, 1);
  const days = Math.floor((sessionDate - startDate) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
  const month = sessionDate.getMonth() + 1;
  const year = sessionDate.getFullYear();

  const validStatuses = ["Present", "Present (Manual)", "Absent", "Late", "Leave", "Pending"];

  // Create an array of operations for bulkWrite
  const ops = attendanceRecords.map(record => {
    if (!validStatuses.includes(record.status)) {
      throw new ApiError(400, `Invalid status: ${record.status}`);
    }
    return {
    updateOne: {
      filter: { sessionId: session._id, studentId: record.studentId },
      update: {
        $set: {
          status: record.status,
          allocationId: session.allocationId,
          section: session.sectionName,
          verificationMethod: "Manual",
          isSuspicious: false,
          date: sessionDate,
          weekNumber,
          month,
          year
        }
      },
      upsert: true
    }
  };
});

  if (ops.length > 0) {
    await Attendance.bulkWrite(ops);
  }

  res.status(200).json(new ApiResponse(200, null, "Bulk attendance inserted successfully"));
});
