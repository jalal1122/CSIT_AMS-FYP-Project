import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    // e.g., "A", "B", "C"
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Role: teacher
    required: true,
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Role: student
  }],
  allowRetroactiveSessions: {
    type: Boolean,
    default: false,
  }
});

const courseAllocationSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Batch",
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  sections: [sectionSchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, { timestamps: true });

// Ensure a subject is only allocated once per batch per semester
courseAllocationSchema.index({ subjectId: 1, batchId: 1, semester: 1 }, { unique: true });
courseAllocationSchema.index({ isActive: 1 });
courseAllocationSchema.index({ "sections.teacherId": 1, isActive: 1 });

const CourseAllocation = mongoose.model("CourseAllocation", courseAllocationSchema);
export default CourseAllocation;
