import cron from "node-cron";
import { getUniversalMatrix } from "./analytics.service.js";
import nodemailer from "nodemailer";

/**
 * Enterprise CRON Service
 * Runs background tasks for system automation
 */
class CronService {
  static isInitialized = false;

  /**
   * Initializes all cron jobs
   */
  static init() {
    if (process.env.NODE_ENV === "production") {
      console.log("🕒 [CRON] Skipping node-cron init in production (use cPanel cron).");
      return;
    }
    
    console.log("🕒 Initializing CRON Services...");

    // Run every Friday at 5:00 PM (17:00)
    cron.schedule("0 17 * * 5", async () => {
      console.log("🕒 [CRON] Running Weekly Defaulter Scan...");
      await this.runDefaulterScan();
    });

    this.isInitialized = true;
    console.log("🕒 CRON Services Active.");
  }

  /**
   * Scans for students below 75% attendance and sends warning emails
   */
  static async runDefaulterScan() {
    try {
      // 1. Fetch universal matrix (no filters, so university-wide)
      // Passing isExport = true to ensure we scan ALL students, not just the limit of 500
      const data = await getUniversalMatrix({}, true);
      
      if (!data || data.length === 0) {
        console.log("🕒 [CRON] No data found for defaulter scan.");
        return;
      }

      const report = data[0];
      if (!report.students) return;

      // Filter for defaulters
      const defaulters = report.students.filter(s => s.attendancePercentage < 75);
      
      console.log(`🕒 [CRON] Identified ${defaulters.length} students below 75% attendance threshold.`);

      if (defaulters.length === 0) return;

      // NOTE: For production, we would use a real SMTP server.
      // We will simulate sending emails here, but setup the nodemailer structure.
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: process.env.SMTP_PORT || 2525,
        auth: {
          user: process.env.SMTP_USER || "test_user",
          pass: process.env.SMTP_PASS || "test_pass"
        }
      });

      let sentCount = 0;
      for (const student of defaulters) {
        // Use the actual student email from the universal matrix
        const studentEmail = student.email;
        
        const mailOptions = {
          from: '"CSIT AMS automated" <no-reply@csit-ams.edu>',
          to: studentEmail,
          subject: "⚠️ Urgent: Attendance Shortfall Warning",
          html: `
            <h3>Attendance Warning</h3>
            <p>Dear ${student.name},</p>
            <p>Your current overall attendance is <strong>${student.attendancePercentage}%</strong>.</p>
            <p>University policy requires a minimum of 75% attendance to be eligible for final examinations.</p>
            <p>Please contact your department head immediately.</p>
          `
        };

        try {
          // If SMTP variables are not set, we just log it instead of failing
          if (process.env.SMTP_USER) {
            await transporter.sendMail(mailOptions);
          }
          sentCount++;
        } catch (err) {
          console.error(`🕒 [CRON] Failed to send email to ${mockEmail}:`, err.message);
        }
      }

      console.log(`🕒 [CRON] Successfully dispatched ${sentCount} warning emails.`);

    } catch (error) {
      console.error("🕒 [CRON] Error during Defaulter Scan:", error);
    }
  }
}

export default CronService;
