import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Session from "../models/session.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import Attendance from "../models/attendance.model.js";
import jwt from "jsonwebtoken";
import { emitToSession } from "../services/socket.js";
// import EmailService from "../services/email.service.js";
import { getClientIP } from "../utils/network.js";

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

  // Check 2: Prevent teacher from running multiple concurrent sessions
  const teacherActiveSession = await Session.findOne({
    teacherId: req.user._id,
    active: true,
  }).select("_id sectionName allocationId").populate("allocationId", "subjectId").lean();

  if (teacherActiveSession) {
    throw new ApiError(409, `You already have an active session running. Please end it before starting a new one.`);
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

  const populatedSession = await Session.findById(session._id).populate({
    path: "allocationId",
    select: "subjectId batchId semester",
    populate: [
      { path: "subjectId", select: "name code" },
      { path: "batchId", select: "name" }
    ]
  }).lean();

  // Emails and sockets
  emitToSession(session._id.toString(), "session:started", { session: populatedSession });

  // Send persistent notifications to all students in the section
  if (section.students && section.students.length > 0) {
    import("../services/notification.service.js").then(({ sendBulkNotification }) => {
      sendBulkNotification(section.students, {
        type: "session_started",
        title: "Live Session Started",
        message: `${allocation.subjectId.name} (${sectionName}) session has been started by your teacher.`,
        link: `/student/live-session/${session._id}`,
        metadata: { sessionId: session._id }
      });
    });
  }

  res.status(201).json(new ApiResponse(201, populatedSession, "Session started successfully"));
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

  // Auto-mark absent for students who didn't mark attendance
  const allocation = await CourseAllocation.findById(session.allocationId);
  if (allocation) {
    const section = allocation.sections.find(s => s.name === session.sectionName);
    const enrolledStudents = section ? section.students : [];
    
    if (enrolledStudents.length > 0) {
      const existingAttendances = await Attendance.find({ sessionId: session._id }).select("studentId").lean();
      const attendedStudentIds = existingAttendances.map(a => a.studentId.toString());
      
      const absentStudents = enrolledStudents.filter(id => !attendedStudentIds.includes(id.toString()));
      
      if (absentStudents.length > 0) {
        const sessionDate = new Date(session.startTime);
        const startDate = new Date(sessionDate.getFullYear(), 0, 1);
        const days = Math.floor((sessionDate - startDate) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
        const month = sessionDate.getMonth() + 1;
        const year = sessionDate.getFullYear();
    
        const absentRecords = absentStudents.map(studentId => ({
          sessionId: session._id,
          studentId,
          allocationId: session.allocationId,
          section: session.sectionName,
          status: "Absent",
          verificationMethod: "System",
          date: sessionDate,
          weekNumber,
          month,
          year
        }));
        await Attendance.insertMany(absentRecords);
      }
    }
  }

  emitToSession(session._id.toString(), "session:ended", { sessionId: session._id });

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
  if (radius !== undefined) {
    session.securityConfig.radius = radius === 0 ? 0 : Math.max(10, Math.min(500, radius));
  }
  if (ipMatchEnabled !== undefined) session.securityConfig.ipMatchEnabled = ipMatchEnabled;
  if (deviceLockEnabled !== undefined) session.securityConfig.deviceLockEnabled = deviceLockEnabled;
  if (qrRefreshRate !== undefined) session.securityConfig.qrRefreshRate = Math.max(5, Math.min(60, qrRefreshRate));
  if (manualApproval !== undefined) session.securityConfig.manualApproval = manualApproval;

  session.markModified('securityConfig');
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

  emitToSession(session._id.toString(), "qr:updated", { qrToken, expiresAt: Date.now() + session.securityConfig.qrRefreshRate * 1000 });

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

// @desc    Get session details by ID
// @route   GET /api/v2/session/:id
// @access  Teacher, Admin
export const getSessionById = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id)
    .populate({
      path: "allocationId",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "batchId", select: "name" }
      ]
    })
    .lean();

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  res.status(200).json(new ApiResponse(200, session, "Session retrieved successfully"));
});

// @desc    Get all active sessions for Admin Monitor
// @route   GET /api/v2/session/active-all
// @access  Admin
export const getActiveSessionsForAdmin = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    active: true,
  })
    .populate("teacherId", "name info.designation")
    .populate({
      path: "allocationId",
      select: "subjectId batchId semester",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "batchId", select: "name" },
      ],
    })
    .sort({ startTime: -1 })
    .lean();

  // Also fetch attendance counts for each session
  const sessionIds = sessions.map((s) => s._id);
  const attendanceCounts = await Attendance.aggregate([
    { $match: { sessionId: { $in: sessionIds } } },
    {
      $group: {
        _id: "$sessionId",
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [
              { $in: ["$status", ["Present", "Present (Manual)", "Late"]] },
              1,
              0,
            ],
          },
        },
        suspicious: {
          $sum: {
            $cond: [{ $eq: ["$isSuspicious", true] }, 1, 0],
          },
        },
      },
    },
  ]);

  const statsMap = attendanceCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr;
    return acc;
  }, {});

  const data = sessions.map((s) => ({
    ...s,
    stats: statsMap[s._id.toString()] || { total: 0, present: 0, suspicious: 0 },
  }));

  res.status(200).json(new ApiResponse(200, data, "Active sessions retrieved"));
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

// @desc    Get complete session details (including all students and absent ones)
// @route   GET /api/v2/session/:id/details
// @access  Teacher
export const getSessionDetails = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    _id: req.params.id,
    teacherId: req.user._id,
  }).populate({
    path: "allocationId",
    populate: { path: "sections.students", select: "name info.rollNo" }
  });

  if (!session) {
    throw new ApiError(404, "Session not found or you are not authorized");
  }

  const section = session.allocationId?.sections?.find(s => s.name === session.sectionName);
  const allStudents = section?.students || [];

  const attendance = await Attendance.find({ sessionId: session._id })
    .populate("studentId", "name info.rollNo")
    .lean();

  const attendanceMap = new Map();
  attendance.forEach(att => {
    if (att.studentId) {
      attendanceMap.set(att.studentId._id.toString(), att);
    }
  });

  const fullDetails = allStudents.map(student => {
    const att = attendanceMap.get(student._id.toString());
    if (att) {
      return {
        id: att._id,
        studentId: student._id,
        name: student.name,
        rollNo: student.info?.rollNo,
        status: att.status,
        time: new Date(att.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isSuspicious: att.isSuspicious,
        flagReason: att.metadata?.flagReason || "",
      };
    } else {
      return {
        id: student._id, // fallback ID
        studentId: student._id,
        name: student.name,
        rollNo: student.info?.rollNo,
        status: session.active ? "Not Scanned" : "Absent",
        time: "-",
        isSuspicious: false,
        flagReason: "",
      };
    }
  });

  // Sort by Name
  fullDetails.sort((a, b) => a.name.localeCompare(b.name));

  res.status(200).json(new ApiResponse(200, { details: fullDetails }, "Session details retrieved"));
});

// @desc    Create a past (retroactive) session
// @route   POST /api/v2/session/retroactive
// @access  Teacher
export const createRetroactiveSession = asyncHandler(async (req, res) => {
  const { allocationId, sectionName, type, startTime, endTime, date } = req.body;

  if (!allocationId || !sectionName || !startTime || !endTime || !date) {
    throw new ApiError(400, "All fields (allocationId, sectionName, type, startTime, endTime, date) are required");
  }

  const allocation = await CourseAllocation.findById(allocationId);
  if (!allocation) throw new ApiError(404, "Course allocation not found");

  const section = allocation.sections.find(s => s.name === sectionName);
  if (!section) throw new ApiError(400, "Section not found");

  if (section.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not assigned to teach this section");
  }

  if (!section.allowRetroactiveSessions) {
    throw new ApiError(403, "Retroactive session creation is currently disabled for this section. Please ask your administrator to grant permission.");
  }

  const sessionStart = new Date(`${date}T${startTime}`);
  const sessionEnd = new Date(`${date}T${endTime}`);

  if (sessionStart > new Date()) {
    throw new ApiError(400, "Retroactive session must be in the past");
  }
  if (sessionStart >= sessionEnd) {
    throw new ApiError(400, "Start time must be before end time");
  }

  const session = await Session.create({
    allocationId,
    sectionName,
    teacherId: req.user._id,
    startTime: sessionStart,
    endTime: sessionEnd,
    active: false,
    isRetroactive: true,
    teacherIP: getClientIP(req),
    type: type || "Lecture",
    securityConfig: {
      radius: 50,
      ipMatchEnabled: false,
      deviceLockEnabled: false,
      qrRefreshRate: 20,
      manualApproval: false,
    },
  });

  res.status(201).json(new ApiResponse(201, session, "Retroactive session created successfully"));
});
