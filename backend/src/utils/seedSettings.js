import SystemSettings from "../models/systemSettings.model.js";

const defaultSettings = [
  { key: "attendanceThreshold",    value: 75,             description: "Minimum attendance percentage required to avoid defaulter status" },
  { key: "timezone",               value: "Asia/Karachi", description: "System timezone for all date operations" },
  { key: "institutionEmailDomain", value: "csit-ams.edu", description: "Auto-generated email domain for new users" },
  { key: "appName",                value: "CSIT AMS",     description: "Application name shown in emails and 2FA" },
  { key: "defaultStudentPassword", value: "password123",  description: "Default password assigned to new students (they must change it)" },
  { key: "defaultTeacherPassword", value: "password123",  description: "Default password assigned to new teachers (they must change it)" },
  { key: "qrRefreshRateMin",       value: 5,              description: "Minimum QR code refresh rate in seconds" },
  { key: "qrRefreshRateMax",       value: 60,             description: "Maximum QR code refresh rate in seconds" },
  { key: "qrRefreshRateDefault",   value: 20,             description: "Default QR code refresh rate in seconds" },
  { key: "geofenceRadiusMin",      value: 10,             description: "Minimum geofence radius in meters" },
  { key: "geofenceRadiusMax",      value: 500,            description: "Maximum geofence radius in meters" },
  { key: "geofenceRadiusDefault",  value: 50,             description: "Default geofence radius in meters" },
];

export const seedSystemSettings = async () => {
  for (const setting of defaultSettings) {
    await SystemSettings.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },  // Only insert if not already present — never overwrite
      { upsert: true, new: true }
    );
  }
  console.log("[SETTINGS] ✅ Default system settings seeded.");
};
