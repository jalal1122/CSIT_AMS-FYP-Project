import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";
import { preventOrphans } from "../middlewares/preventOrphans.middleware.js";
import * as system from "../controllers/system.controller.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];

router.post("/department", ...adminOnly, system.createDepartment);
router.get("/departments", ...adminOnly, system.getDepartments);
router.put("/department/:id", ...adminOnly, system.updateDepartment);
router.delete("/department/:id", ...adminOnly, preventOrphans("departmentId"), system.deleteDepartment);

router.post("/subject", ...adminOnly, system.createSubject);
router.get("/subjects", ...adminOnly, system.getSubjects);
router.get("/subjects/:id", ...adminOnly, system.getSubjectById);
router.put("/subject/:id", ...adminOnly, system.updateSubject);

router.post("/discipline", ...adminOnly, system.createDiscipline);
router.get("/disciplines", ...adminOnly, system.getDisciplines);
router.put("/discipline/:id", ...adminOnly, system.updateDiscipline);
router.delete("/discipline/:id", ...adminOnly, preventOrphans("disciplineId"), system.deleteDiscipline);
router.put("/discipline/:id/syllabus", ...adminOnly, system.updateSyllabus);
router.get("/discipline/:id/syllabus", ...adminOnly, system.getSyllabus);

router.post("/teacher", ...adminOnly, system.createTeacher);

export default router;
