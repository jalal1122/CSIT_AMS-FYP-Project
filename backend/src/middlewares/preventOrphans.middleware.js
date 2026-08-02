import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Batch from "../models/batch.model.js";
import Discipline from "../models/discipline.model.js";
import Subject from "../models/subject.model.js";
import User from "../models/user.model.js";
import CourseAllocation from "../models/courseAllocation.model.js";

/**
 * Middleware factory that checks if a record
 * has active references before allowing deletion.
 *
 * Usage: router.delete("/:id", preventOrphans("departmentId"), deleteDept)
 */
export const preventOrphans = (field) => asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const messages = [];

  // Check Batches (applies to departmentId and disciplineId)
  if (field === "departmentId" || field === "disciplineId") {
    const batchCount = await Batch.countDocuments({ [field]: id });
    if (batchCount > 0) messages.push(`${batchCount} batch(es)`);
    
    const userCount = await User.countDocuments({ [`info.${field}`]: id });
    if (userCount > 0) messages.push(`${userCount} user(s)`);
  }

  // Specific to Department
  if (field === "departmentId") {
    const discCount = await Discipline.countDocuments({ departmentId: id });
    if (discCount > 0) messages.push(`${discCount} discipline(s)`);
    
    const subCount = await Subject.countDocuments({ departmentId: id });
    if (subCount > 0) messages.push(`${subCount} subject(s)`);
  }

  // Specific to Subject
  if (field === "subjectId") {
    const allocCount = await CourseAllocation.countDocuments({ subjectId: id });
    if (allocCount > 0) messages.push(`${allocCount} course allocation(s)`);
    
    const discCount = await Discipline.countDocuments({ "syllabus.subjects": id });
    if (discCount > 0) messages.push(`${discCount} discipline(s) have this subject in their syllabus`);
  }

  if (messages.length > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${messages.join(", ")} are linked to this record.`
    );
  }
  next();
});
