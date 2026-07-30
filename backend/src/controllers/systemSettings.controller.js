import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import SystemSettings from "../models/systemSettings.model.js";

/**
 * Get all system settings (Public or authenticated based on needs, UI settings can be public)
 * GET /api/v2/settings
 */
export const getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.find().lean();
  
  // Convert array to key-value object for easy frontend consumption
  const settingsMap = {};
  settings.forEach(setting => {
    settingsMap[setting.key] = setting.value;
  });

  res.status(200).json(
    new ApiResponse(200, settingsMap, "System settings retrieved successfully")
  );
});

/**
 * Update system settings (Admin only)
 * PUT /api/v2/settings
 * Body: { [key]: value, ... }
 */
export const updateSystemSettings = asyncHandler(async (req, res) => {
  const updates = req.body;

  if (!updates || typeof updates !== "object") {
    throw ApiError.badRequest("Invalid settings data format");
  }

  // Update each key in the database
  const updatedSettings = [];
  for (const [key, value] of Object.entries(updates)) {
    const updated = await SystemSettings.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true } // Create if doesn't exist
    );
    updatedSettings.push(updated);
  }

  // Convert array to key-value object for easy frontend consumption
  const settingsMap = {};
  updatedSettings.forEach(setting => {
    settingsMap[setting.key] = setting.value;
  });

  res.status(200).json(
    new ApiResponse(200, settingsMap, "System settings updated successfully")
  );
});
