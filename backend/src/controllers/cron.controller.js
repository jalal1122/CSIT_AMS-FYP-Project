import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import CourseAllocation from "../models/courseAllocation.model.js";
import Attendance from "../models/attendance.model.js";
import User from "../models/user.model.js";
import EmailService from "../services/email.service.js"; // Note: services might not exist yet, will be created later

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SHARED DEFAULTER LOGIC
 * Called by BOTH node-cron (local) and the HTTP trigger endpoint (production).
 *
 * 1. Finds all active CourseAllocations.
 * 2. Per section, aggregates attendance percentages.
 * 3. Emails any student whose percentage < 75%.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const runDefaulterCheck = async () => {
  console.log("[CRON] ⏰ Starting defaulter check...");
  let emailsSent = 0;
  let errors = 0;

  // Step 1: Fetch all active course allocations with populated refs
  const activeAllocations = await CourseAllocation.find({ isActive: true })
    .populate("subjectId", "name code")
    .populate("batchId", "name");

  for (const allocation of activeAllocations) {
    for (const section of allocation.sections) {
      const studentIds = section.students;
      if (!studentIds.length) continue;

      // Step 2: Aggregate attendance per student for this section
      const stats = await Attendance.aggregate([
        {
          $match: {
            allocationId: allocation._id,
            studentId: { $in: studentIds },
          },
        },
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
        // Step 3: Filter only defaulters (< 75%)
        { $match: { percentage: { $lt: 75 } } },
      ]);

      // Step 4: Email each defaulter (skip students with no email set yet)
      for (const stat of stats) {
        const student = await User.findById(stat._id).select("name email");
        if (!student?.email) continue;

        try {
          await EmailService.sendDefaulterAlert(
            student,
            allocation.subjectId,
            stat.percentage.toFixed(1)
          );
          emailsSent++;
        } catch (emailErr) {
          console.error(`[CRON] ❌ Failed to email ${student.email}:`, emailErr.message);
          errors++;
        }
      }
    }
  }

  console.log(`[CRON] ✅ Done. Emails sent: ${emailsSent}, Errors: ${errors}`);
  return { emailsSent, errors };
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HTTP TRIGGER ENDPOINT (Production / cPanel)
 * POST /api/v2/cron/trigger-defaulters
 *
 * Security: Requires Authorization: Bearer <CRON_SECRET> header.
 * Called by: cPanel Linux cron via curl.
 * Also usable manually from Postman or Admin dashboard.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const triggerDefaulters = asyncHandler(async (req, res) => {
  // ── Security check: validate the cron secret ──────────────────────────────
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedToken) {
    throw new ApiError(403, "Forbidden: Invalid or missing cron secret");
  }

  // ── Run the shared logic ──────────────────────────────────────────────────
  // Fire-and-forget: respond immediately so curl doesn't time out,
  // let the email job complete in the background.
  res.status(202).json(
    new ApiResponse(202, {}, "Defaulter check accepted and running in background")
  );

  // Run after response is flushed
  runDefaulterCheck().catch((err) =>
    console.error("[CRON] ❌ Unhandled error in defaulter check:", err)
  );
});
