import mongoose from "mongoose";

const systemTrafficLogSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    // We group traffic by hour to keep the collection small
    timestampHour: {
      type: Date,
      required: true,
      index: true,
    }
  }
);

// Compound index for fast upserts and querying
systemTrafficLogSchema.index({ endpoint: 1, method: 1, timestampHour: 1 }, { unique: true });

const SystemTrafficLog = mongoose.model("SystemTrafficLog", systemTrafficLogSchema);

export default SystemTrafficLog;
