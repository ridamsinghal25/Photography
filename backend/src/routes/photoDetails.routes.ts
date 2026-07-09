import { Router } from "express";
import {
  createPhoto,
  updatePhotoMetadata,
  updatePhotoMedia,
  getPhotoById,
  getPhotosByUserId,
  deletePhoto,
} from "../controllers/photoDetails.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/", getPhotosByUserId);

router.use(verifyToken);

router.post("/", createPhoto);
router.get("/:id", getPhotoById);
router.patch("/:id/metadata", updatePhotoMetadata);
router.patch("/:id/media", updatePhotoMedia);
router.delete("/:id", deletePhoto);

export default router;
