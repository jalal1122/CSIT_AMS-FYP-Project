import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Session from "../models/session.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import Attendance from "../models/attendance.model.js";
import jwt from "jsonwebtoken";
// import { emitToSession } from "../services/socket.js";
// import EmailService from "../services/email.service.js";

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
};

// @desc    Start Live Session
// @route   POST /api/v2/session/start
// @access  Teacher
export const startSession = asyncHandler(async (req, res) => {
  const { allocationId, sectionName, type, latitude, longitude, securityConfig } = req.body;

  if (!allocationId || !sectionName) {
    throw new ApiError(400, "Allocation ID and sectionName are required");
  }

  const validTypes = ["Lecture", "Lab", "Exam"];
  if (type && !validTypes.includes(type)) {
    throw new ApiError(400, `Type must be one of: ${validTypes.join(", ")}`);
  }

  const allocation = await CourseAllocation.findById(allocationId)
    .populate("batchId", "isActive name")
    .populate("subjectId", "name code")
    .select("sections isActive semester batchId subjectId");
    
  if (!allocation) throw new ApiError(404, "Course allocation not found");
  if (!allocation.isActive) throw new ApiError(400, "This allocation is no longer active (semester may have been promoted)");

  const section = allocation.sections.find(s => s.name === sectionName);
  if (!section) throw new ApiError(400, "Section not found in this allocation");
  if (section.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not assigned to teach this section");
  }

  const existingActiveSession = await Session.findOne({
    allocationId,
    sectionName,
    active: true,
  }).select("_id").lean();

  if (existingActiveSession) {
    return res.status(200).json(new ApiResponse(200, existingActiveSession, "Active session resumed"));
  }

  const teacherIP = getClientIP(req);

  const location = {};
  if (latitude !== undefined && longitude !== undefined) {
    location.latitude = parseFloat(latitude);
    location.longitude = parseFloat(longitude);
  }

  const rawRadius = securityConfig?.radius || 50;
  const rawQrRefresh = securityConfig?.qrRefreshRate || 20;

  const clampedRadius = Math.max(10, Math.min(500, rawRadius));
  const clampedQrRefresh = Math.max(5, Math.min(60, rawQrRefresh));

  const finalSecurityConfig = {
    radius: clampedRadius,
    ipMatchEnabled: securityConfig?.ipMatchEnabled !== undefined ? securityConfig.ipMatchEnabled : true,
    deviceLockEnabled: securityConfig?.deviceLockEnabled !== undefined ? securityConfig.deviceLockEnabled : true,
    qrRefreshRate: clampedQrRefresh,
    manualApproval: securityConfig?.manualApproval !== undefined ? securityConfig.manualApproval : false,
  };

  const session = await Session.create({
    allocationId,
    sectionName,
    teacherId: req.user._id,
    startTime: new Date(),
    active: true,
    isRetroactive: false,
    teacherIP,
    type: type || "Lecture",
    location: Object.keys(location).length > 0 ? location : undefined,
    securityConfig: finalSecurityConfig,
  });

  // TODO: Emails and sockets
  // emitToSession(session._id.toString(), "session:started", { ... });

  res.status(201).json(new ApiResponse(201, session, "Session started successfully"));
});

// @desc    End Session
// @route   POST /api/v2/session/:id/end
// @access  Teacher
export const endSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    teacherId: req.user._id,
  });

  if (!session) {
    throw new ApiError(404, "Session not found or you are not authorized");
  }

  if (!session.active) {
    throw new ApiError(400, "Session is already ended");
  }

  session.active = false;
  session.endTime = new Date();
  await session.save();

  // emitToSession(session._id.toString(), "session:ended", { sessionId: session._id });

  res.status(200).json(new ApiResponse(200, session, "Session ended successfully"));
});

// @desc    Update Security Settings of an active Session
// @route   PUT /api/v2/session/:id/security
// @access  Teacher
export const updateSessionSecurity = asyncHandler(async (req, res) => {
  const { radius, ipMatchEnabled, deviceLockEnabled, qrRefreshRate, manualApproval } = req.body;

  const session = await Session.findOne({
    _id: req.params.id,
    teacherId: req.user._id,
    active: true,
  });

  if (!session) {
    throw new ApiError(404, "Active session not found or you are not authorized");
  }

  // Update only the provided fields
  if (radius !== undefined) session.securityConfig.radius = Math.max(10, Math.min(500, radius));
  if (ipMatchEnabled !== undefined) session.securityConfig.ipMatchEnabled = ipMatchEnabled;
  if (deviceLockEnabled !== undefined) session.securityConfig.deviceLockEnabled = deviceLockEnabled;
  if (qrRefreshRate !== undefined) session.securityConfig.qrRefreshRate = Math.max(5, Math.min(60, qrRefreshRate));
  if (manualApproval !== undefined) session.securityConfig.manualApproval = manualApproval;

  await session.save();

  res.status(200).json(new ApiResponse(200, session, "Session security settings updated"));
});

// @desc    Generate a new QR code token for an active session
// @route   GET /api/v2/session/:id/qr
// @access  Teacher
export const generateQRToken = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    teacherId: req.user._id,
    active: true,
  });

  if (!session) {
    throw new ApiError(404, "Active session not found or you are not authorized");
  }

  const tokenPayload = {
    sessionId: session._id,
    allocationId: session.allocationId,
    sectionName: session.sectionName,
    timestamp: Date.now(),
  };

  const qrToken = jwt.sign(tokenPayload, process.env.QR_SECRET, {
    expiresIn: `${session.securityConfig.qrRefreshRate}s`,
  });

  session.qrCodeHash = qrToken;
  await session.save({ validateBeforeSave: false });

  // emitToSession(session._id.toString(), "qr:updated", { qrToken, expiresAt: Date.now() + session.securityConfig.qrRefreshRate * 1000 });

  res.status(200).json(new ApiResponse(200, { qrToken, refreshRate: session.securityConfig.qrRefreshRate }, "QR token generated"));
});

// @desc    Get the current active session for the logged in teacher
// @route   GET /api/v2/session/active
// @access  Teacher
export const getActiveSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    teacherId: req.user._id,
    active: true,
  }).populate({
    path: "allocationId",
    select: "subjectId batchId semester",
    populate: [
      { path: "subjectId", select: "name code" },
      { path: "batchId", select: "name" }
    ]
  }).lean();

  if (!session) {
    return res.status(200).json(new ApiResponse(200, null, "No active session found"));
  }

  res.status(200).json(new ApiResponse(200, session, "Active session retrieved"));
});

// @desc    Get live attendance for a specific session
// @route   GET /api/v2/session/:id/live
// @access  Teacher
export const getLiveAttendance = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    teacherId: req.user._id,
  });

  if (!session) {
    throw new ApiError(404, "Session not found or you are not authorized");
  }

  const attendance = await Attendance.find({ sessionId: session._id })
    .populate("studentId", "name info.rollNo")
    .sort({ date: -1 })
    .lean();

  // Format it for the UI
  const liveFeed = attendance.map(att => ({
    id: att._id,
    studentId: att.studentId._id,
    name: att.studentId.name,
    rollNo: att.studentId.info?.rollNo,
    status: att.status,
    time: new Date(att.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    isSuspicious: att.isSuspicious,
    flagReason: att.metadata?.flagReason || "",
  }));

  res.status(200).json(new ApiResponse(200, { liveFeed }, "Live attendance retrieved"));
});
