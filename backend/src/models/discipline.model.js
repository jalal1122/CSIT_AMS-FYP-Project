import mongoose from "mongoose";

// Each semester entry in the syllabus
const semesterEntrySchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 10, // Supports up to 5-year programs
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
  }]
}, { _id: false });

const disciplineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Discipline name is required"],
    trim: true,
    unique: true,
    // e.g., "BS Computer Science"
  },
  code: {
    type: String,
    required: [true, "Discipline code is required"],
    unique: true,
    uppercase: true,
    trim: true,
    // e.g., "BSCS"
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: [true, "Department is required"],
    index: true,
  },
  totalSemesters: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 8,
  },
  // The Curriculum Map
  syllabus: [semesterEntrySchema]
}, { timestamps: true });

disciplineSchema.index({ code: 1 });

const Discipline = mongoose.model("Discipline", disciplineSchema);
export default Discipline;
