import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import Batch from "../models/batch.model.js";

/**
 * Middleware factory that checks if a Department/Discipline
 * has active Batches before allowing deletion.
 *
 * Usage: router.delete("/:id", preventOrphans("departmentId"), deleteDept)
 */
export const preventOrphans = (field) => asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const count = await Batch.countDocuments({ [field]: id, isActive: true });

  if (count > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${count} active batch(es) are linked to this record. Deactivate all batches first.`
    );
  }
  next();
});
