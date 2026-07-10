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

router.get("/:userId", getPhotosByUserId);
router.get("/photo/:id", getPhotoById);

router.use(verifyToken);

router.post("/", createPhoto);
router.patch("/:id/metadata", updatePhotoMetadata);
router.patch("/:id/media", updatePhotoMedia);
router.delete("/:id", deletePhoto);

export default router;
