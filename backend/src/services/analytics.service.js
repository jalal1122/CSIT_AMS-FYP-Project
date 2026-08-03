import mongoose from "mongoose";
import moment from "moment-timezone";
import Attendance from "../models/attendance.model.js";
import Session from "../models/session.model.js";

const TIMEZONE = "Asia/Karachi";

/**
 * Merges security match, filters, and timeframe into a single query object.
 */
export const buildDynamicMatch = (securityMatch, filters, timeframe, prefix = "") => {
  const query = { ...securityMatch };
  const p = prefix ? `${prefix}.` : "";

  // All or Multiple logic for filters
  if (filters?.subjects && filters.subjects.length > 0) {
    query[`${p}subjectId`] = { $in: filters.subjects.map(id => new mongoose.Types.ObjectId(id)) };
  }
  
  if (filters?.batches && filters.batches.length > 0) {
    query[`${p}batchId`] = { $in: filters.batches.map(id => new mongoose.Types.ObjectId(id)) };
  }

  // Timeframe logic
  if (timeframe) {
    let startDate, endDate;
    const now = moment.tz(TIMEZONE);
    
    switch (timeframe) {
      case "Last Week":
        startDate = now.clone().subtract(1, "weeks").startOf("week").toDate();
        endDate = now.clone().subtract(1, "weeks").endOf("week").toDate();
        break;
      case "Last Month":
        startDate = now.clone().subtract(1, "months").startOf("month").toDate();
        endDate = now.clone().subtract(1, "months").endOf("month").toDate();
        break;
      case "Full Semester":
        // Depending on business logic, this could span 6 months. For now, we omit date filtering for full.
        break;
      case "Custom Date Range":
        if (filters.startDate && filters.endDate) {
          startDate = moment.tz(filters.startDate, TIMEZONE).startOf("day").toDate();
          endDate = moment.tz(filters.endDate, TIMEZONE).endOf("day").toDate();
        }
        break;
    }

    if (startDate && endDate) {
      // Assuming Attendance/Session have a `date` field. Prefix might not apply if date is on root.
      // We assume date is always on the root collection being aggregated (Attendance or Session).
      query.date = { $gte: startDate, $lte: endDate };
    }
  }

  return query;
};

/**
 * Specific Insight Pipelines
 */

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
          $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
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
