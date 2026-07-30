import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Batch name is required"],
    unique: true,
    trim: true,
    // e.g., "BSCS Fall 2021"
  },
  disciplineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Discipline",
    required: [true, "Discipline is required"],
    index: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: [true, "Department is required"],
    index: true,
  },
  startingYear: {
    type: Number,
    required: true,
    min: 2000,
  },
  currentSemester: {
    type: Number,
    required: true,
    min: 0, // 0 = graduated/archived
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // Used for Promotion Rollback
  previousSemester: {
    type: Number,
    default: null,
  }
}, { timestamps: true });

batchSchema.index({ disciplineId: 1, currentSemester: 1 });

const Batch = mongoose.model("Batch", batchSchema);
export default Batch;
