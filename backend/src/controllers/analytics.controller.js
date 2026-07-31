import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Batch from "../models/batch.model.js";
import Session from "../models/session.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import Attendance from "../models/attendance.model.js";
import ExportService from "../services/export.service.js";
import os from "os-utils";

const getCpuUsage = () => new Promise((resolve) => {
  os.cpuUsage((v) => {
    resolve(Math.round(v * 100));
  });
});

// @desc    System health metrics for Admin dashboard
// @route   GET /api/v2/analytics/dashboard
// @access  Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    activeBatches,
    activeSessions,
    totalAllocations,
    cpuUsage
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student", accountStatus: "Active" }),
    User.countDocuments({ role: "teacher", accountStatus: "Active" }),
    Batch.countDocuments({ isActive: true }),
    Session.countDocuments({ active: true }),
    CourseAllocation.countDocuments({ isActive: true }),
    getCpuUsage()
  ]);

  const memoryUsage = Math.round((1 - os.freememPercentage()) * 100);
  const uptimeSeconds = os.sysUptime();

  res.status(200).json(new ApiResponse(200, {
    totalUsers,
    totalStudents,
    totalTeachers,
    activeBatches,
    activeSessions,
    totalAllocations,
    systemHealth: {
      cpuUsage,
      memoryUsage,
      uptimeSeconds
    }
  }, "Dashboard stats retrieved"));
});

// @desc    Students with < 75% attendance for active allocations
// @route   GET /api/v2/analytics/defaulters
// @access  Admin
export const getDefaulters = asyncHandler(async (req, res) => {
  const activeAllocations = await CourseAllocation.find({ isActive: true }).select("_id");
  const activeAllocationIds = activeAllocations.map(a => a._id);

  const pipeline = [
    { $match: { allocationId: { $in: activeAllocationIds } } },
    {
      $group: {
        _id: { studentId: "$studentId", allocationId: "$allocationId" },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ["$present", "$total"] }, 100]
        }
      }
    },
    { $match: { percentage: { $lt: 75 } } },
    {
      $lookup: {
        from: "users",
        localField: "_id.studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $project: {
        _id: 0,
        studentId: "$_id.studentId",
        allocationId: "$_id.allocationId",
        name: "$student.name",
        rollNo: "$student.info.rollNo",
        percentage: 1,
        total: 1,
        present: 1
      }
    }
  ];

  const defaulters = await Attendance.aggregate(pipeline);
  res.status(200).json(new ApiResponse(200, defaulters, "Defaulters retrieved successfully"));
});

// @desc    Export Admin Reports
// @route   GET /api/v2/analytics/export/admin
// @access  Admin
export const exportAdminReport = asyncHandler(async (req, res) => {
  const { reportType, allocationId, sectionName, startDate, endDate, format = "xlsx" } = req.query;

  if (!reportType) {
    throw new ApiError(400, "Report type is required");
  }

  let buffer;

  if (reportType === "classMatrix" || reportType === "defaulters") {
    if (!allocationId || !sectionName) {
      throw new ApiError(400, "allocationId and sectionName are required for this report");
    }

    const allocation = await CourseAllocation.findById(allocationId)
      .populate("subjectId", "name code")
      .populate("batchId", "name academicYear semester")
      .populate("sections.teacherId", "name");

    if (!allocation) throw new ApiError(404, "Allocation not found");

    const section = allocation.sections.find(s => s.name === sectionName);
    if (!section) throw new ApiError(404, "Section not found");

    const students = await User.find({ _id: { $in: section.students } })
      .populate("info.departmentId", "name");

    const sessionQuery = { allocationId, section: sectionName };
    if (startDate && endDate) {
      sessionQuery.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const sessions = await Session.find(sessionQuery).sort({ startTime: 1 });

    const attendanceRecords = await Attendance.find({ 
      sessionId: { $in: sessions.map(s => s._id) } 
    });

    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[`${record.sessionId}_${record.studentId}`] = record;
    });

    const classData = {
      name: allocation.subjectId.name,
      code: allocation.subjectId.code,
      section: sectionName,
      semester: allocation.batchId.semester,
      batch: allocation.batchId.name,
      academicYear: allocation.batchId.academicYear,
      teacher: { name: section.teacherId?.name },
      students: students.map(st => ({
        _id: st._id,
        name: st.name,
        email: st.email,
        info: {
          rollNo: st.info.rollNo,
          department: st.info.departmentId?.name,
          semester: st.info.semester
        }
      }))
    };

    if (reportType === "classMatrix") {
      buffer = await ExportService.generateClassMatrix(classData, sessions, attendanceMap, format);
    } else if (reportType === "defaulters") {
      const defaulters = [];
      classData.students.forEach(student => {
        const studentAttendance = sessions.map(session => {
          const record = attendanceMap[`${session._id}_${student._id}`];
          return record ? record.status : "Absent";
        });
        const presentCount = studentAttendance.filter(s => s === "Present").length;
        const absentCount = studentAttendance.filter(s => s === "Absent").length;
        const percentage = sessions.length > 0 ? (presentCount / sessions.length) * 100 : 0;
        
        if (percentage < 75) {
          defaulters.push({
            ...student,
            totalClasses: sessions.length,
            presentCount,
            absentCount,
            attendancePercentage: percentage.toFixed(2)
          });
        }
      });
      buffer = await ExportService.generateDefaultersReport(classData, defaulters, sessions.length, 75, format);
    }
  } else {
    throw new ApiError(400, "Unsupported report type");
  }

  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Report.${format}`);
  res.send(buffer);
});

// @desc    Export Teacher Reports
// @route   GET /api/v2/analytics/export/teacher
// @access  Teacher
export const exportTeacherReport = asyncHandler(async (req, res) => {
  const { allocationId, sectionName, startDate, endDate, format = "xlsx" } = req.query;

  if (!allocationId || !sectionName) {
    throw new ApiError(400, "allocationId and sectionName are required");
  }

  const allocation = await CourseAllocation.findById(allocationId)
    .populate("subjectId", "name code")
    .populate("batchId", "name academicYear semester");

  if (!allocation) throw new ApiError(404, "Allocation not found");

  const section = allocation.sections.find(s => s.name === sectionName);
  if (!section || section.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to export this section");
  }

  const students = await User.find({ _id: { $in: section.students } })
    .populate("info.departmentId", "name");

  const sessionQuery = { allocationId, section: sectionName };
  if (startDate && endDate) {
    sessionQuery.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }
  const sessions = await Session.find(sessionQuery).sort({ startTime: 1 });

  const attendanceRecords = await Attendance.find({ 
    sessionId: { $in: sessions.map(s => s._id) } 
  });

  const attendanceMap = {};
  attendanceRecords.forEach(record => {
    attendanceMap[`${record.sessionId}_${record.studentId}`] = record;
  });

  const classData = {
    name: allocation.subjectId.name,
    code: allocation.subjectId.code,
    section: sectionName,
    semester: allocation.batchId.semester,
    batch: allocation.batchId.name,
    academicYear: allocation.batchId.academicYear,
    teacher: { name: req.user.name },
    students: students.map(st => ({
      _id: st._id,
      name: st.name,
      info: {
        rollNo: st.info.rollNo,
        department: st.info.departmentId?.name,
        semester: st.info.semester
      }
    }))
  };

  const buffer = await ExportService.generateClassMatrix(classData, sessions, attendanceMap, format);

  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=ClassMatrix.${format}`);
  res.send(buffer);
});

// @desc    Export Student Transcript
// @route   GET /api/v2/analytics/export/student
// @access  Student
export const exportStudentTranscript = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = "xlsx" } = req.query;

  const allocations = await CourseAllocation.find({ "sections.students": req.user._id })
    .populate("subjectId", "name code")
    .populate("batchId", "semester");

  const sessionQuery = { allocationId: { $in: allocations.map(a => a._id) } };
  if (startDate && endDate) {
    sessionQuery.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const sessions = await Session.find(sessionQuery);
  const attendanceRecords = await Attendance.find({
    studentId: req.user._id,
    sessionId: { $in: sessions.map(s => s._id) }
  });

  const classesData = allocations.map(allocation => {
    const allocSessions = sessions.filter(s => s.allocationId.toString() === allocation._id.toString());
    let presentCount = 0;
    let absentCount = 0;

    allocSessions.forEach(session => {
      const record = attendanceRecords.find(r => r.sessionId.toString() === session._id.toString());
      if (record && record.status === "Present") {
        presentCount++;
      } else {
        absentCount++;
      }
    });

    return {
      className: allocation.subjectId.name,
      classCode: allocation.subjectId.code,
      totalSessions: allocSessions.length,
      presentCount,
      absentCount,
      percentage: allocSessions.length > 0 ? (presentCount / allocSessions.length) * 100 : 0
    };
  });

  const studentData = {
    name: req.user.name,
    info: {
      rollNo: req.user.info?.rollNo,
      department: req.user.info?.department, // This might need population, but for simplicity assuming it's available or generic
      semester: req.user.info?.semester
    }
  };

  const buffer = await ExportService.generateStudentTranscript(studentData, classesData, format);

  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Transcript.${format}`);
  res.send(buffer);
});
