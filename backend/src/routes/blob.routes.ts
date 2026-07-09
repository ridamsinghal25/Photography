import { Router } from "express";
import { getUploadSasUrl } from "../controllers/blob.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/sas-url", verifyToken, getUploadSasUrl);

export default router;
