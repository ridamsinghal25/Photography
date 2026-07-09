import { Request, Response } from "express";
import sharp from "sharp";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiResponse } from "../lib/ApiResponse";
import { ApiError } from "../lib/ApiError";
import photoDetailsService from "../services/photoDetails.services";
import photoTagsService from "../services/photoTags.services";
import photoCategoriesService from "../services/photoCategories.services";
import blobService from "../services/blob.services";
import { BlobFolder } from "../enums/enum";

function blobPath(userId: string, folder: BlobFolder, storedFileName: string) {
  return `${userId}/${folder}/${storedFileName}`;
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const img = sharp(buffer).withMetadata();
  switch (mimeType) {
    case "image/png": return img.png({ compressionLevel: 8 }).toBuffer();
    case "image/webp": return img.webp({ quality: 75 }).toBuffer();
    default: return img.jpeg({ quality: 75 }).toBuffer();
  }
}

const createPhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    storedFileName, originalFileName, originalUrl, mimeType, fileSize,
    categoryId, tags,
    ...metadata
  } = req.body;

  const [categoryExists, photoCount, foundTagIds] = await Promise.all([
    photoCategoriesService.getCategoryById(categoryId),
    photoDetailsService.getPhotoCountByUserId(userId),
    tags?.length ? photoTagsService.getExistingTagIds(tags) : Promise.resolve([]),
  ]);

  if (!categoryExists) {
    throw new ApiError(404, "Category does not exist");
  }


  /** Uncomment if you want all tags to be validated */
  // if (tags?.length && foundTagIds.length !== tags.length) {
  //   throw new ApiError(404, "One or more tags do not exist");
  // }

  const photo = await photoDetailsService.createPhoto({
    userId,
    categoryId,
    userPhotoNumber: photoCount + 1,
    originalFileName,
    storedFileName,
    originalUrl,
    mimeType,
    fileSize,
    ...metadata,
  });

  // Compress original → upload compressed → update DB + replace tags in parallel
  const originalBuffer = await blobService.downloadBuffer(
    blobPath(userId, BlobFolder.Original, storedFileName)
  );

  const compressedUrl = await blobService.uploadBuffer(
    blobPath(userId, BlobFolder.Compressed, storedFileName),
    await compressImage(originalBuffer, mimeType),
    mimeType
  );

  await Promise.all([
    photoDetailsService.updatePhotoImageData(photo.id, { compressedUrl }),
    tags?.length ? photoTagsService.replacePhotoTags(photo.id, tags) : Promise.resolve(),
  ]);

  return res
    .status(201)
    .json(
      new ApiResponse(201, photo, "Photo created successfully"),
    );
});

const updatePhotoMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { categoryId, tags, ...metadata } = req.body;

  const existing = await photoDetailsService.getPhotoById(id);

  if (!existing) {
    throw new ApiError(404, "Photo not found");
  }

  if (categoryId) {
    const categoryExists = await photoCategoriesService.getCategoryById(categoryId);

    if (!categoryExists) {
      throw new ApiError(404, "Category does not exist");
    }
    
    metadata.categoryId = categoryId;
  }

  let foundTagIds: string[] = [];
  if (tags?.length) {
    foundTagIds = await photoTagsService.getExistingTagIds(tags);

    /** Uncomment if you want all tags to be validated */
    // if (foundTagIds.length !== tags.length) {
    //   throw new ApiError(404, "One or more tags do not exist");
    // }
  }

  await Promise.all([
    Object.keys(metadata).length ? photoDetailsService.updatePhotoMetadata(id, metadata) : Promise.resolve(),
    tags !== undefined ? photoTagsService.replacePhotoTags(id, foundTagIds) : Promise.resolve(),
  ]);

  const updated = await photoDetailsService.getPhotoById(id);

  if (!updated) {
    throw new ApiError(404, "Photo not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updated, "Photo metadata updated successfully"),
    );
});

const updatePhotoMedia = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const { originalFileName, storedFileName, originalUrl, mimeType, fileSize } = req.body;

  const existing = await photoDetailsService.getPhotoById(id);

  if (!existing) {
    throw new ApiError(404, "Photo not found");
  }

  const originalBuffer = await blobService.downloadBuffer(
    blobPath(userId, BlobFolder.Original, storedFileName)
  );
  const compressedUrl = await blobService.uploadBuffer(
    blobPath(userId, BlobFolder.Compressed, storedFileName),
    await compressImage(originalBuffer, mimeType),
    mimeType
  );

  // Update DB before deleting old blobs — if delete fails, orphaned blobs are cheap, data loss is not
  const updated = await photoDetailsService.updatePhotoImageData(id, {
    originalFileName,
    storedFileName,
    originalUrl,
    compressedUrl,
    fileSize,
    mimeType,
  });

  if (existing.storedFileName !== storedFileName) {
    blobService.deletePhoto(userId, existing.storedFileName).catch(() => {});
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updated, "Photo media updated successfully"),
    );
});

const getPhotoById = asyncHandler(async (req: Request, res: Response) => {
  const photo = await photoDetailsService.getPhotoById(req.params.id);

  if (!photo) {
    throw new ApiError(404, "Photo not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, photo, "Photo retrieved successfully"),
    );
});

const getPhotosByUserId = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const { photos, total } = await photoDetailsService.getPhotosByUserId(req.user!.id, page, limit);

  return res.status(200).json(new ApiResponse(200, {
    photos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }));
});

const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await photoDetailsService.getPhotoById(id);

  if (!existing) {
    throw new ApiError(404, "Photo not found");
  }

  await blobService.deletePhoto(userId, existing.storedFileName);

  await photoDetailsService.deletePhoto(id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { id }, "Photo deleted successfully"),
    );
});

export { createPhoto, updatePhotoMetadata, updatePhotoMedia, getPhotoById, getPhotosByUserId, deletePhoto };
