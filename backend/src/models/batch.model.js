import mongoose from "mongoose";

// Individual section within a batch
const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Section name is required"],
    trim: true,
    // Either a single letter (A, B, C) or a descriptive name (Morning, Evening, CS-01)
  },
  status: {
    type: String,
    enum: ["active", "archived"],
    default: "active",
  },
  // Denormalized cache — updated on each student upload / transfer
  studentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { _id: true, timestamps: true });

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Batch name is required"],
    unique: true,
    trim: true,
    // e.g., "BSCS - Fall 2021"
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
    min: 0, // 0 = graduated/completed
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
  },
  sections: [sectionSchema],

  // Per-batch subject override per semester (overrides discipline.syllabus if set)
  // Shape: [{ semester: 1, subjects: [ObjectId, ...] }]
  semesterSubjects: [{
    semester: { type: Number, required: true, min: 1, max: 10 },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    _id: false,
  }],
}, { timestamps: true });

batchSchema.index({ disciplineId: 1, currentSemester: 1 });

const Batch = mongoose.model("Batch", batchSchema);
export default Batch;
