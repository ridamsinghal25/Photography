import { Request, Response } from "express";
import sharp from "sharp";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiResponse } from "../lib/ApiResponse";
import { ApiError } from "../lib/ApiError";
import photoDetailsService from "../services/photoDetails.services";
// import photoTagsService from "../services/photoTags.services";
// import photoCategoriesService from "../services/photoCategories.services";
import blobService from "../services/blob.services";
import subjectsService from "../services/subjects.services";
import { BlobFolder } from "../enums/enum";
import appUsersServices from "../services/appUsers.services";

function blobPath(userId: string, folder: BlobFolder, storedFileName: string) {
  return `${userId}/${folder}/${storedFileName}`;
}

async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const img = sharp(buffer).withMetadata();
  switch (mimeType) {
    case "image/png": return img.png({ compressionLevel: 8 }).toBuffer();
    case "image/webp": return img.webp({ quality: 75 }).toBuffer();
    case "image/jpeg": return img.jpeg({ quality: 75 }).toBuffer();
    case "image/heic": return img.heif({ quality: 75 }).toBuffer();
    case "image/heif": return img.heif({ quality: 75 }).toBuffer();
    case "image/avif": return img.avif({ quality: 75 }).toBuffer();
    case "image/tiff": return img.tiff({ quality: 75 }).toBuffer();
    case "image/heic-sequence": return img.heif({ quality: 75 }).toBuffer();
    case "image/heif-sequence": return img.heif({ quality: 75 }).toBuffer();
    default: return img.jpeg({ quality: 75 }).toBuffer();
  }
}

const createPhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const {
    storedFileName, originalUrl, mimeType, fileSize,
    subjectId, slug,
    // categoryId, tags,
    ...metadata
  } = req.body;

  // const [categoryExists, photoCount, foundTagIds] = await Promise.all([
  //   photoCategoriesService.getCategoryById(categoryId),
  //   photoDetailsService.getPhotoCountByUserId(userId),
  //   tags?.length ? photoTagsService.getExistingTagIds(tags) : Promise.resolve([]),
  // ]);

  // if (!categoryExists) {
  //   throw new ApiError(404, "Category does not exist");
  // }

  // /** Uncomment if you want all tags to be validated */
  // if (tags?.length && foundTagIds.length !== tags.length) {
  //   throw new ApiError(404, "One or more tags do not exist");
  // }

  if (subjectId) {
    const subject = await subjectsService.getSubjectById(subjectId);

    if (!subject) {
      throw new ApiError(404, "Subject not found");
    } 
  }

  const slugUnique = await photoDetailsService.isSlugUnique(userId, slug);
  if (!slugUnique) {
    throw new ApiError(409, "Slug already in use");
  }

  const photo = await photoDetailsService.createPhoto({
    userId,
    // categoryId,
    slug,
    subjectId,
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

  await photoDetailsService.updatePhotoImageData(photo.id, { compressedUrl });

  // await Promise.all([
  //   photoDetailsService.updatePhotoImageData(photo.id, { compressedUrl }),
  //   tags?.length ? photoTagsService.replacePhotoTags(photo.id, tags) : Promise.resolve(),
  // ]);

  return res
    .status(201)
    .json(
      new ApiResponse(201, photo, "Photo created successfully"),
    );
});

const updatePhotoMetadata = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    subjectId, slug,
    // categoryId, tags,
    ...rest
  } = req.body;

  const existing = await photoDetailsService.getPhotoById(id);

  if (!existing) {
    throw new ApiError(404, "Photo not found");
  }

  // if (categoryId) {
  //   const categoryExists = await photoCategoriesService.getCategoryById(categoryId);
  //
  //   if (!categoryExists) {
  //     throw new ApiError(404, "Category does not exist");
  //   }
  //
  //   metadata.categoryId = categoryId;
  // }

  // let foundTagIds: string[] = [];
  // if (tags?.length) {
  //   foundTagIds = await photoTagsService.getExistingTagIds(tags);
  //
  //   /** Uncomment if you want all tags to be validated */
  //   // if (foundTagIds.length !== tags.length) {
  //   //   throw new ApiError(404, "One or more tags do not exist");
  //   // }
  // }

  if (subjectId) {
    const subject = await subjectsService.getSubjectById(subjectId);

    if (!subject) {
      throw new ApiError(404, "Subject not found");
    }
  }

  if (slug) {
    const slugUnique = await photoDetailsService.isSlugUnique(existing.userId, slug, id);
    
    if (!slugUnique) {
      throw new ApiError(409, "Slug already in use");
    }
  }

  await photoDetailsService.updatePhotoMetadata(id, { subjectId, slug, ...rest });

  // await Promise.all([
  //   Object.keys(metadata).length ? photoDetailsService.updatePhotoMetadata(id, metadata) : Promise.resolve(),
  //   tags !== undefined ? photoTagsService.replacePhotoTags(id, foundTagIds) : Promise.resolve(),
  // ]);

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
  
  const { storedFileName, originalUrl, mimeType, fileSize } = req.body;

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

// Slug is unique per user, so we need to find the user first and then get the photo by slug
// For now, we will assume that the slug is unique across all users and just get the photo by slug
const getPhotoBySlug = asyncHandler(async (req: Request, res: Response) => {
  const photo = await photoDetailsService.getPhotoBySlug(req.params.slug);

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
  const userId = req.params.userId;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await appUsersServices.getUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { photos, total } = await photoDetailsService.getPhotosByUserId(userId, page, limit);

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

export { createPhoto, updatePhotoMetadata, updatePhotoMedia, getPhotoById, getPhotoBySlug, getPhotosByUserId, deletePhoto };
