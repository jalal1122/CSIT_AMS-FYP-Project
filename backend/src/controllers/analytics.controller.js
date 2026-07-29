import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Batch from "../models/batch.model.js";
import Session from "../models/session.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import Attendance from "../models/attendance.model.js";

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
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "student", accountStatus: "Active" }),
    User.countDocuments({ role: "teacher", accountStatus: "Active" }),
    Batch.countDocuments({ isActive: true }),
    Session.countDocuments({ active: true }),
    CourseAllocation.countDocuments({ isActive: true }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    totalUsers,
    totalStudents,
    totalTeachers,
    activeBatches,
    activeSessions,
    totalAllocations
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
