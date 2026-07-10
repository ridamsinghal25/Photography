import { Router } from "express";
import { createSubject, getSubjects, getSubjectById, updateSubject, deleteSubject } from "../controllers/subjects.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = Router();

router.use(verifyToken);

router.get("/", getSubjects);
router.post("/", createSubject);
router.get("/:id", getSubjectById);
router.patch("/:id", updateSubject);
router.delete("/:id", deleteSubject);

export default router;
