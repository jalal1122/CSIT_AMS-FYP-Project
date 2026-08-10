import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import connectDB from "./config/db.js";

// v2 Routes
// We will uncomment these as we build the controllers in Phase 3
import systemRoutes from "./src/routes/system.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import academicRoutes from "./src/routes/academic.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import sessionRoutes from "./src/routes/session.routes.js";
import attendanceRoutes from "./src/routes/attendance.routes.js";
import analyticsRoutes from "./src/routes/analytics.routes.js";
import cronRoutes from "./src/routes/cron.routes.js";
import systemSettingsRoutes from "./src/routes/systemSettings.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";

import { initSocket } from "./src/services/socket.js";
import CronService from "./src/services/cron.service.js";
import { trafficLogger } from "./src/middlewares/trafficLogger.js";

const app = express();

// System Traffic Logger
app.use(trafficLogger);

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: process.env.BODY_SIZE_LIMIT || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_SIZE_LIMIT || "10mb" }));
app.use(cookieParser());
app.use(mongoSanitize()); // Strips $ and . from user input to prevent NoSQL injection

// Base Routes
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "CSIT AMS API Root" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "CSIT AMS API is healthy" });
});

app.get("/api/v2/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "CSIT AMS v2 API is running" });
});

// v2 API Routes 
app.use("/api/v2/system", systemRoutes);
app.use("/api/v2/auth", authRoutes);
app.use("/api/v2/academic", academicRoutes);
app.use("/api/v2/admin", adminRoutes);
app.use("/api/v2/session", sessionRoutes);
app.use("/api/v2/attendance", attendanceRoutes);
app.use("/api/v2/analytics", analyticsRoutes);
app.use("/api/v2/cron", cronRoutes);
app.use("/api/v2/settings", systemSettingsRoutes);
app.use("/api/v2/notifications", notificationRoutes);

// Global Error Handler — MUST be after all routes
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];
  const errorCode = err.errorCode || null;

  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${statusCode} ${req.method} ${req.originalUrl} — ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(errorCode && { errorCode }),
  });
});

// Connect to Database and start server
const PORT = process.env.PORT || 5001;

import { seedSystemSettings } from "./src/utils/seedSettings.js";

if (process.env.NODE_ENV !== "test") {
  connectDB()
    .then(async () => {
      await seedSystemSettings();
      const server = app.listen(PORT, () => {
        console.log(`🚀 CSIT AMS v2 Server running on port ${PORT}`);
        initSocket(server);
        CronService.init();
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed", err);
      process.exit(1);
    });
}

export default app;
