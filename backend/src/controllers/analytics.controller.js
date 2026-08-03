import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import Batch from "../models/batch.model.js";
import Session from "../models/session.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import { getSecurityMatch } from "../utils/reportSecurity.js";
import * as analyticsService from "../services/analytics.service.js";
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

// @desc    Generate dynamic report
// @route   POST /api/v2/analytics/generate
// @access  Protected
export const generateReport = asyncHandler(async (req, res) => {
  const { target, timeframe, filters } = req.body;
  const securityMatch = getSecurityMatch(req.user, "allocation");
  const dynamicMatch = analyticsService.buildDynamicMatch(securityMatch, filters, timeframe, "allocation");

  let data = [];
  
  switch(target) {
    case "defaulter-matrix":
      data = await analyticsService.getDefaulterMatrix(dynamicMatch);
      break;
    case "teacher-utilization":
      data = await analyticsService.getTeacherUtilization(dynamicMatch);
      break;
    case "at-risk-trajectory":
      data = await analyticsService.getAtRiskTrajectory(dynamicMatch);
      break;
    default:
      throw new ApiError(400, "Invalid report target");
  }

  if (!data || data.length === 0) {
    return res.status(200).json(new ApiResponse(200, { total: 0, present: 0, percentage: null, data: [] }, "No data available for this timeframe"));
  }

  res.status(200).json(new ApiResponse(200, data, "Report generated successfully"));
});

// @desc    Export dynamic report
// @route   POST /api/v2/analytics/export
// @access  Protected
export const exportReport = asyncHandler(async (req, res) => {
  const { target, timeframe, filters, format = "xlsx" } = req.body;
  const securityMatch = getSecurityMatch(req.user, "allocation");
  const dynamicMatch = analyticsService.buildDynamicMatch(securityMatch, filters, timeframe, "allocation");

  let data = [];
  switch(target) {
    case "defaulter-matrix":
      data = await analyticsService.getDefaulterMatrix(dynamicMatch);
      break;
    case "teacher-utilization":
      data = await analyticsService.getTeacherUtilization(dynamicMatch);
      break;
    case "at-risk-trajectory":
      data = await analyticsService.getAtRiskTrajectory(dynamicMatch);
      break;
    default:
      throw new ApiError(400, "Invalid export target");
  }

  if (!data || data.length === 0) {
    throw new ApiError(404, "No data to export");
  }

  const buffer = await ExportService.generateDynamicExport(data, format);
  
  res.setHeader('Content-Disposition', `attachment; filename="AttendX_${target}_${timeframe || 'Export'}.${format}"`);
  res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});
