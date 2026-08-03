import mongoose from "mongoose";

const deviceResetLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousDeviceId: {
      type: String,
      default: "Unknown",
    },
    reason: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// Index for fast analytics retrieval
deviceResetLogSchema.index({ createdAt: -1 });

const DeviceResetLog = mongoose.model("DeviceResetLog", deviceResetLogSchema);

export default DeviceResetLog;
