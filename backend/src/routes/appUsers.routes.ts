import { Router } from "express";
import { getUser } from "../controllers/appUsers.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = Router();

router.use(verifyToken);

router.get("/me", getUser);

export default router;
