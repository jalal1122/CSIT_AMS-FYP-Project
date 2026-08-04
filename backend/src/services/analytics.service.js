import mongoose from "mongoose";
import moment from "moment-timezone";
import Attendance from "../models/attendance.model.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import DeviceResetLog from "../models/deviceResetLog.model.js";
import SystemTrafficLog from "../models/systemTrafficLog.model.js";

const TIMEZONE = "Asia/Karachi";

/**
 * Merges security match, filters, and timeframe into a single query object.
 */
export const buildDynamicMatch = async (securityMatch, filters, timeframe, prefix = "") => {
  const query = { ...securityMatch };
  const p = prefix ? `${prefix}.` : "";

  // All or Multiple logic for filters
  if (filters?.subjects && filters.subjects.length > 0) {
    query[`${p}subjectId`] = { $in: filters.subjects.map(id => new mongoose.Types.ObjectId(id)) };
  }
  
  // Department, Discipline & Batch logic
  let allowedBatches = [];
  if (filters?.batches && filters.batches.length > 0) {
    allowedBatches = filters.batches.map(id => new mongoose.Types.ObjectId(id));
  } else if ((filters?.departments && filters.departments.length > 0) || (filters?.disciplines && filters.disciplines.length > 0)) {
    const batchQuery = { isActive: true };
    if (filters?.departments && filters.departments.length > 0) {
      batchQuery.departmentId = { $in: filters.departments.map(id => new mongoose.Types.ObjectId(id)) };
    }
    if (filters?.disciplines && filters.disciplines.length > 0) {
      batchQuery.disciplineId = { $in: filters.disciplines.map(id => new mongoose.Types.ObjectId(id)) };
    }
    const BatchModel = mongoose.model("Batch");
    const matchingBatches = await BatchModel.find(batchQuery, "_id");
    allowedBatches = matchingBatches.map(b => b._id);
    if (allowedBatches.length === 0) {
      // Force an impossible match if no batches match
      allowedBatches = [new mongoose.Types.ObjectId()];
    }
  }

  if (allowedBatches.length > 0) {
    query[`${p}batchId`] = { $in: allowedBatches };
  }

  if (filters?.semester) {
    query[`${p}semester`] = Number(filters.semester);
  }

  if (filters?.teachers && filters.teachers.length > 0) {
    // If prefix is "allocation", this means we are aggregating Attendance or Session.
    // Instead of filtering allocation.sections.teacherId which leaks other sections' data,
    // we should filter on session.teacherId (if Session is looked up).
    // For now, we will add an explicit session lookup in the pipeline if this is present.
    // To support the existing pipeline, we will match BOTH allocation.sections.teacherId AND (later in the pipeline) session.teacherId
    query[`${p}sections.teacherId`] = { $in: filters.teachers.map(id => new mongoose.Types.ObjectId(id)) };
  }

  if (filters?.sections && filters.sections.length > 0) {
    query[`${p}sections.name`] = { $in: filters.sections };
  }

  if (filters?.students && filters.students.length > 0) {
    // Optimize: query the root studentId if it's an Attendance query
    if (!query.$or) query.$or = [];
    query.$or.push({ studentId: { $in: filters.students.map(id => new mongoose.Types.ObjectId(id)) } });
    query.$or.push({ [`${p}sections.students`]: { $in: filters.students.map(id => new mongoose.Types.ObjectId(id)) } });
  }

  // Timeframe logic
  if (timeframe) {
    let startDate, endDate;
    const now = moment.tz(TIMEZONE);
    
    switch (timeframe) {
      case "Today":
        startDate = now.clone().startOf("day").toDate();
        endDate = now.clone().endOf("day").toDate();
        break;
      case "Last 7 Days":
      case "Last Week":
        startDate = now.clone().subtract(7, "days").startOf("day").toDate();
        endDate = now.clone().endOf("day").toDate();
        break;
      case "Last 30 Days":
      case "Last Month":
        startDate = now.clone().subtract(30, "days").startOf("day").toDate();
        endDate = now.clone().endOf("day").toDate();
        break;
      case "Full Semester":
        // Fallback to 6 month window
        startDate = now.clone().subtract(6, "months").startOf("day").toDate();
        endDate = now.clone().endOf("day").toDate();
        break;
      case "Custom Date Range":
        if (filters.startDate && filters.endDate) {
          startDate = moment.tz(filters.startDate, TIMEZONE).startOf("day").toDate();
          endDate = moment.tz(filters.endDate, TIMEZONE).endOf("day").toDate();
        }
        break;
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
  }

  return query;
};

/**
 * Specific Insight Pipelines
 */

export const getUniversalMatrix = async (matchQuery, isExport = false) => {
  const studentsPipeline = [
    {
      $group: {
        _id: "$studentId",
        name: { $first: "$studentInfo.name" },
        email: { $first: "$studentInfo.email" },
        rollNo: { $first: "$studentInfo.info.rollNo" },
        batch: { $first: "$batchInfo.name" },
        department: { $first: "$departmentInfo.name" },
        discipline: { $first: "$disciplineInfo.name" },
        totalScans: { $sum: 1 },
        presents: { $sum: { $cond: [{ $in: ["$status", ["Present", "Present (Manual)", "Late"]] }, 1, 0] } },
        absents: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
        leaves: { $sum: { $cond: [{ $eq: ["$status", "Leave"] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        rollNo: 1,
        batch: 1,
        department: 1,
        discipline: 1,
        totalScans: 1,
        presents: 1,
        absents: 1,
        leaves: 1,
        attendancePercentage: {
          $cond: [
            { $gt: ["$totalScans", 0] },
            { $round: [{ $multiply: [{ $divide: ["$presents", "$totalScans"] }, 100] }, 1] },
            0
          ]
        }
      }
    },
    { $sort: { attendancePercentage: 1, rollNo: 1 } }
  ];

  if (!isExport) {
    studentsPipeline.push({ $limit: 500 });
  }

  const subjectsPipeline = [
    {
      $group: {
        _id: "$allocation.subjectId",
        subjectName: { $first: "$subjectInfo.name" },
        subjectCode: { $first: "$subjectInfo.code" },
        totalScans: { $sum: 1 },
        presents: { $sum: { $cond: [{ $in: ["$status", ["Present", "Present (Manual)", "Late"]] }, 1, 0] } },
        absents: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 1,
        subjectName: 1,
        subjectCode: 1,
        totalScans: 1,
        presents: 1,
        absents: 1,
        attendancePercentage: {
          $cond: [
            { $gt: ["$totalScans", 0] },
            { $round: [{ $multiply: [{ $divide: ["$presents", "$totalScans"] }, 100] }, 1] },
            0
          ]
        }
      }
    },
    { $sort: { subjectName: 1 } }
  ];

  if (!isExport) {
    subjectsPipeline.push({ $limit: 100 });
  }

  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      }
    },
    { $unwind: "$studentInfo" },
    {
      $lookup: {
        from: "subjects",
        localField: "allocation.subjectId",
        foreignField: "_id",
        as: "subjectInfo",
      }
    },
    { $unwind: { path: "$subjectInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "batches",
        localField: "allocation.batchId",
        foreignField: "_id",
        as: "batchInfo",
      }
    },
    { $unwind: { path: "$batchInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "departments",
        localField: "batchInfo.departmentId",
        foreignField: "_id",
        as: "departmentInfo",
      }
    },
    { $unwind: { path: "$departmentInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "disciplines",
        localField: "batchInfo.disciplineId",
        foreignField: "_id",
        as: "disciplineInfo",
      }
    },
    { $unwind: { path: "$disciplineInfo", preserveNullAndEmptyArrays: true } },
    {
      $facet: {
        // 1. Overall Attendance Summary
        summary: [
          {
            $group: {
              _id: null,
              totalScans: { $sum: 1 },
              totalPresents: { $sum: { $cond: [{ $in: ["$status", ["Present", "Present (Manual)", "Late"]] }, 1, 0] } },
              totalAbsents: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
              totalLeaves: { $sum: { $cond: [{ $eq: ["$status", "Leave"] }, 1, 0] } },
              manualOverrides: { $sum: { $cond: [{ $eq: ["$status", "Present (Manual)"] }, 1, 0] } }
            }
          }
        ],
        // 2. Student-Level Aggregation (For Teacher "At-Risk Radar" & "Comparison Matrix")
        students: studentsPipeline,
        // 3. Subject-Level Aggregation (For Student "Personal Transcript")
        subjects: subjectsPipeline
      }
    }
  ]);
};

export const getExamEligibilityMatrix = async (matchQuery, threshold = 75) => {
  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    {
      $group: {
        _id: "$studentId",
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ["$status", ["Present", "Present (Manual)", "Late"]] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ["$present", "$total"] }, 100],
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: "$studentInfo" },
    {
      $project: {
        studentId: "$_id",
        name: "$studentInfo.name",
        rollNo: "$studentInfo.info.rollNo",
        percentage: 1,
        total: 1,
        present: 1,
        status: {
          $cond: [{ $gte: ["$percentage", Number(threshold)] }, "Eligible", "Detained"]
        }
      },
    },
    { $sort: { rollNo: 1 } }
  ]);
};

export const getInterDisciplineBenchmark = async (matchQuery) => {
  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    {
      $lookup: {
        from: "batches",
        localField: "allocation.batchId",
        foreignField: "_id",
        as: "batch",
      }
    },
    { $unwind: "$batch" },
    {
      $group: {
        _id: "$batch.disciplineId",
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ["$status", ["Present", "Present (Manual)", "Late"]] }, 1, 0] },
        },
      }
    },
    {
      $addFields: {
        averageAttendance: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
            0
          ]
        }
      }
    },
    {
      $lookup: {
        from: "disciplines",
        localField: "_id",
        foreignField: "_id",
        as: "disciplineInfo"
      }
    },
    { $unwind: { path: "$disciplineInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        disciplineId: "$_id",
        name: { $ifNull: ["$disciplineInfo.name", "Unknown Discipline"] },
        averageAttendance: 1,
        totalSessions: "$total"
      }
    },
    { $sort: { averageAttendance: -1 } }
  ]);
};

export const getMedicalLeaveLedger = async (matchQuery) => {
  const query = { ...matchQuery, status: "Leave" };
  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: query },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      }
    },
    { $unwind: "$studentInfo" },
    {
      $group: {
        _id: "$studentId",
        name: { $first: "$studentInfo.name" },
        rollNo: { $first: "$studentInfo.info.rollNo" },
        totalLeaves: { $sum: 1 },
      }
    },
    {
      $project: {
        studentId: "$_id",
        name: 1,
        rollNo: 1,
        totalLeaves: 1
      }
    },
    { $sort: { totalLeaves: -1 } }
  ]);
};

export const getRepeaterMatrix = async (matchQuery) => {
  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      }
    },
    { $unwind: "$studentInfo" },
    {
      $match: {
        $expr: { $ne: ["$allocation.batchId", "$studentInfo.info.batchId"] }
      }
    },
    {
      $group: {
        _id: { studentId: "$studentId", allocationId: "$allocationId" },
        name: { $first: "$studentInfo.name" },
        rollNo: { $first: "$studentInfo.info.rollNo" },
        subjectId: { $first: "$allocation.subjectId" },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$status", ["Present", "Present (Manual)", "Late"]] }, 1, 0] } }
      }
    },
    {
      $lookup: {
        from: "subjects",
        localField: "subjectId",
        foreignField: "_id",
        as: "subjectInfo"
      }
    },
    { $unwind: { path: "$subjectInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        studentId: "$_id.studentId",
        allocationId: "$_id.allocationId",
        name: 1,
        rollNo: 1,
        subjectName: { $ifNull: ["$subjectInfo.name", "Unknown Subject"] },
        total: 1,
        present: 1,
        percentage: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { rollNo: 1 } }
  ]);
};

export const getStudentOnboardingStatus = async () => {
  return await User.aggregate([
    { $match: { role: "student" } },
    {
      $match: {
        $or: [
          { mustChangePassword: true },
          { email: null },
          { email: "" },
          { email: { $exists: false } }
        ]
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        rollNo: "$info.rollNo",
        mustChangePassword: 1,
        email: 1,
        createdAt: 1
      }
    },
    { $sort: { rollNo: 1 } }
  ]);
};

export const getGeofenceDrift = async (matchQuery) => {
  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    { $match: { "metadata.location.latitude": { $exists: true } } },
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      }
    },
    { $unwind: "$studentInfo" },
    {
      $group: {
        _id: "$studentId",
        name: { $first: "$studentInfo.name" },
        rollNo: { $first: "$studentInfo.info.rollNo" },
        // Simple drift estimation (e.g. accuracy > 50m might indicate drift/spoofing)
        driftIncidents: {
          $sum: {
            $cond: [
              { $gt: [{ $toDouble: "$metadata.location.accuracy" }, 50] },
              1, 0
            ]
          }
        },
        totalScans: { $sum: 1 }
      }
    },
    { $match: { driftIncidents: { $gt: 0 } } },
    {
      $project: {
        studentId: "$_id",
        name: 1,
        rollNo: 1,
        driftIncidents: 1,
        totalScans: 1
      }
    },
    { $sort: { driftIncidents: -1 } }
  ]);
};

export const getDeviceBindingAudit = async () => {
  return await DeviceResetLog.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $lookup: {
        from: "users",
        localField: "adminId",
        foreignField: "_id",
        as: "admin"
      }
    },
    { $unwind: "$admin" },
    {
      $project: {
        _id: 1,
        studentName: "$student.name",
        rollNo: "$student.info.rollNo",
        adminName: "$admin.name",
        previousDeviceId: 1,
        reason: 1,
        resetDate: "$createdAt"
      }
    },
    { $sort: { resetDate: -1 } }
  ]);
};

export const getSystemUsagePeaks = async () => {
  return await SystemTrafficLog.aggregate([
    {
      $group: {
        _id: {
          hour: { $hour: { date: "$timestampHour", timezone: TIMEZONE } },
          dayOfWeek: { $dayOfWeek: { date: "$timestampHour", timezone: TIMEZONE } }
        },
        avgTraffic: { $avg: "$count" },
        totalTraffic: { $sum: "$count" }
      }
    },
    {
      $project: {
        _id: 0,
        hour: "$_id.hour",
        dayOfWeek: "$_id.dayOfWeek",
        avgTraffic: { $round: ["$avgTraffic", 0] },
        totalTraffic: 1
      }
    },
    { $sort: { totalTraffic: -1 } }
  ]);
};

export const getTimeOfDayAbsenteeism = async (matchQuery) => {
  return await Session.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    {
      $group: {
        _id: {
          hour: { $hour: { date: "$startTime", timezone: TIMEZONE } }
        },
        totalSessions: { $sum: 1 },
        totalAbsents: { $sum: "$stats.absent" },
        totalPresents: { $sum: "$stats.present" }
      }
    },
    {
      $project: {
        _id: 0,
        hour: "$_id.hour",
        totalSessions: 1,
        absentRate: {
          $cond: [
            { $gt: [{ $add: ["$totalPresents", "$totalAbsents"] }, 0] },
            { $multiply: [{ $divide: ["$totalAbsents", { $add: ["$totalPresents", "$totalAbsents"] }] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { hour: 1 } }
  ]);
};

export const getDefaulterMatrix = async (matchQuery) => {
  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    {
      $group: {
        _id: "$studentId",
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $in: ["$status", ["Present", "Present (Manual)", "Late"]] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ["$present", "$total"] }, 100],
        },
      },
    },
    { $match: { percentage: { $lt: 75 } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: "$studentInfo" },
    {
      $project: {
        studentId: "$_id",
        name: "$studentInfo.name",
        rollNo: "$studentInfo.info.rollNo",
        percentage: 1,
        total: 1,
        present: 1,
      },
    },
    { $sort: { percentage: 1 } }
  ]);
};

export const getTeacherUtilization = async (matchQuery) => {
  return await Session.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    {
      $lookup: {
        from: "attendances",
        localField: "_id",
        foreignField: "sessionId",
        as: "attendanceRecords",
      },
    },
    {
      $unwind: { path: "$attendanceRecords", preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: { sessionId: "$_id", teacherId: "$teacherId" },
        manualVerifications: {
          $sum: { $cond: [{ $eq: ["$attendanceRecords.verificationMethod", "Manual"] }, 1, 0] }
        },
        qrVerifications: {
          $sum: { $cond: [{ $eq: ["$attendanceRecords.verificationMethod", "QR"] }, 1, 0] }
        }
      }
    },
    {
      $group: {
        _id: "$_id.teacherId",
        totalSessions: { $sum: 1 },
        totalManual: { $sum: "$manualVerifications" },
        totalQR: { $sum: "$qrVerifications" }
      }
    },
    {
      $addFields: {
        totalVerifications: { $add: ["$totalManual", "$totalQR"] }
      }
    },
    {
      $addFields: {
        manualOverrideRate: {
          $cond: [
            { $gt: ["$totalVerifications", 0] },
            { $multiply: [{ $divide: ["$totalManual", "$totalVerifications"] }, 100] },
            0
          ]
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "teacherInfo"
      }
    },
    { $unwind: "$teacherInfo" },
    {
      $project: {
        teacherId: "$_id",
        name: "$teacherInfo.name",
        totalSessions: 1,
        manualOverrideRate: 1
      }
    }
  ]);
};

export const getAtRiskTrajectory = async (matchQuery) => {
  return await Attendance.aggregate([
    {
      $lookup: {
        from: "courseallocations",
        localField: "allocationId",
        foreignField: "_id",
        as: "allocation",
      },
    },
    { $unwind: "$allocation" },
    { $match: matchQuery },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: "$studentId",
        recentRecords: { $push: "$status" },
      }
    },
    {
      $project: {
        lastFive: { $slice: ["$recentRecords", 5] }
      }
    },
    {
      $addFields: {
        absencesInLastFive: {
          $size: {
            $filter: {
              input: "$lastFive",
              as: "status",
              cond: { $eq: ["$$status", "Absent"] }
            }
          }
        }
      }
    },
    { $match: { absencesInLastFive: { $gte: 3 } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "studentInfo"
      }
    },
    { $unwind: "$studentInfo" },
    {
      $project: {
        studentId: "$_id",
        name: "$studentInfo.name",
        absencesInLastFive: 1
      }
    }
  ]);
};
