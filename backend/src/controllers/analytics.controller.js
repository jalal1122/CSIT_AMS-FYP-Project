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

// @desc    Get Comprehensive Report
// @route   GET /api/v2/analytics/comprehensive
// @access  Admin, Teacher
export const getComprehensiveReport = asyncHandler(async (req, res) => {
  const { 
    groupBy = "section", 
    departmentId, 
    disciplineId, 
    batchId, 
    allocationId,
    section,
    startDate,
    endDate
  } = req.query;

  // 1. Build Allocation Match Query
  const allocMatch = { isActive: true };

  // Role Limits
  if (req.user.role === "teacher") {
    allocMatch["sections.teacherId"] = req.user._id;
  }

  if (allocationId) allocMatch._id = allocationId;
  
  // If we need to filter by batch/discipline/department, we need to populate batch first
  const allocationQuery = CourseAllocation.find(allocMatch)
    .populate("subjectId", "name code")
    .populate({
      path: "batchId",
      match: {
        ...(batchId && { _id: batchId }),
        ...(disciplineId && { disciplineId }),
        ...(departmentId && { departmentId })
      },
      populate: [
        { path: "departmentId", select: "name" },
        { path: "disciplineId", select: "name" }
      ]
    });

  const allocationsRaw = await allocationQuery;
  // Filter out null batches (if they didn't match the populate match)
  const allocations = allocationsRaw.filter(a => a.batchId);
  const allocationIds = allocations.map(a => a._id);

  if (allocationIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, null, "No data found for the given criteria"));
  }

  // 2. Find Sessions for these allocations
  const sessionMatch = { allocationId: { $in: allocationIds } };
  if (section) sessionMatch.sectionName = section;
  if (startDate && endDate) {
    sessionMatch.startTime = { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    };
  }

  if (req.user.role === "teacher") {
    sessionMatch.teacherId = req.user._id;
  }

  const sessions = await Session.find(sessionMatch).sort({ startTime: 1 }).lean();
  const sessionIds = sessions.map(s => s._id);

  if (sessionIds.length === 0) {
    return res.status(200).json(new ApiResponse(200, null, "No sessions found for the given criteria"));
  }

  // 3. Fetch Attendance
  const attendanceRecords = await Attendance.find({ sessionId: { $in: sessionIds } }).lean();

  // 4. Process Data
  let totalPresent = 0;
  let totalAbsences = 0;
  
  const studentStats = {};
  const trendMap = {};
  const comparisonMap = {};

  attendanceRecords.forEach(record => {
    if (record.status === "Present") totalPresent++;
    if (record.status === "Absent") totalAbsences++;

    // Defaulters calc
    if (!studentStats[record.studentId]) {
      studentStats[record.studentId] = { present: 0, absent: 0, total: 0, section: record.section };
    }
    studentStats[record.studentId].total++;
    if (record.status === "Present") studentStats[record.studentId].present++;
    else if (record.status === "Absent") studentStats[record.studentId].absent++;
    
    // Trend calc
    const sess = sessions.find(s => s._id.toString() === record.sessionId.toString());
    if (sess) {
      const dateStr = new Date(sess.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!trendMap[dateStr]) trendMap[dateStr] = { date: dateStr, present: 0, absent: 0 };
      if (record.status === "Present") trendMap[dateStr].present++;
      else if (record.status === "Absent") trendMap[dateStr].absent++;

      // Comparison calc
      let compKey = "Unknown";
      const alloc = allocations.find(a => a._id.toString() === record.allocationId.toString());
      
      if (groupBy === "department" && alloc?.batchId?.departmentId) {
        compKey = alloc.batchId.departmentId.name;
      } else if (groupBy === "discipline" && alloc?.batchId?.disciplineId) {
        compKey = alloc.batchId.disciplineId.name;
      } else if (groupBy === "batch" && alloc?.batchId) {
        compKey = alloc.batchId.name;
      } else if (groupBy === "class" && alloc?.subjectId) {
        compKey = alloc.subjectId.name;
      } else {
        compKey = record.section;
      }

      if (!comparisonMap[compKey]) comparisonMap[compKey] = { section: compKey, present: 0, total: 0 };
      comparisonMap[compKey].total++;
      if (record.status === "Present") comparisonMap[compKey].present++;
    }
  });

  const avgAttendancePercentage = attendanceRecords.length > 0 
    ? Math.round((totalPresent / attendanceRecords.length) * 100) 
    : 0;

  const attendanceTrend = Object.values(trendMap);
  const sectionComparison = Object.values(comparisonMap).map(c => ({
    section: c.section,
    avgAttendance: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0
  }));

  // Identify Defaulters (< 75%)
  const defaulterIds = Object.keys(studentStats).filter(sid => {
    const stat = studentStats[sid];
    const pct = stat.total > 0 ? (stat.present / stat.total) * 100 : 100;
    return pct < 75;
  });

  let defaulters = [];
  if (defaulterIds.length > 0) {
    const users = await User.find({ _id: { $in: defaulterIds } }).select("name info.rollNo").lean();
    defaulters = users.map(u => {
      const stat = studentStats[u._id.toString()];
      return {
        studentId: u.info?.rollNo,
        studentName: u.name,
        section: stat.section,
        present: stat.present,
        total: stat.total,
        attendancePercentage: Math.round((stat.present / stat.total) * 100)
      };
    }).sort((a, b) => a.attendancePercentage - b.attendancePercentage);
  }

  const reportData = {
    summary: {
      totalSessions: sessions.length,
      avgAttendancePercentage,
      defaultersCount: defaulters.length,
      totalAbsences
    },
    attendanceTrend,
    sectionComparison,
    defaulters
  };

  res.status(200).json(new ApiResponse(200, reportData, "Comprehensive report generated"));
});
