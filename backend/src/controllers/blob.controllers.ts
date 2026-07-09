import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiResponse } from "../lib/ApiResponse";
import blobService from "../services/blob.services";
import { BlobFolder, ImageMimeType, IMAGE_MIME_TO_EXT } from "../enums/enum";
import { ApiError } from "../lib/ApiError";

const getUploadSasUrl = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { mimeType } = req.body;

  const ext = IMAGE_MIME_TO_EXT[mimeType as ImageMimeType] 

  if (!ext) {
    return res
    .status(400)
    .json(new ApiError(400, "Invalid image mime type"));
  }

  const storedFileName = `${randomUUID()}${ext}`;
  const blobName = `${userId}/${BlobFolder.Original}/${storedFileName}`;

  const sasUrl = blobService.generateUploadSasUrl(blobName);

  return res
  .status(200)
  .json(
    new ApiResponse(200, { sasUrl, storedFileName }, "SAS URL generated successfully")
  );
});

export { getUploadSasUrl };
