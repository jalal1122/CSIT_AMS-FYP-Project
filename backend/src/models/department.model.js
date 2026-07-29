import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Department name is required"],
    trim: true,
    unique: true,
    // e.g., "Faculty of Management and Computer Sciences"
  },
  code: {
    type: String,
    required: [true, "Department code is required"],
    unique: true,
    uppercase: true,
    trim: true,
    // e.g., "FMCS"
  },
}, { timestamps: true });

departmentSchema.index({ code: 1 });

const Department = mongoose.model("Department", departmentSchema);
export default Department;
