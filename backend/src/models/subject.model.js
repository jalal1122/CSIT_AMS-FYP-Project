import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Subject name is required"],
    trim: true,
    // e.g., "Database Systems"
  },
  code: {
    type: String,
    required: [true, "Subject code is required"],
    unique: true,
    uppercase: true,
    trim: true,
    // e.g., "CS301"
  },
  creditHours: {
    type: Number,
    required: [true, "Credit hours are required"],
    min: [1, "Credit hours must be at least 1"],
    max: [6, "Credit hours cannot exceed 6"],
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: [true, "Department is required"],
    index: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });


subjectSchema.index({ departmentId: 1, isArchived: 1 });

const Subject = mongoose.model("Subject", subjectSchema);
export default Subject;
