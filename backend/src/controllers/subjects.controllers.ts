import { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiResponse } from "../lib/ApiResponse";
import { ApiError } from "../lib/ApiError";
import { extractMessagesFromFlatten } from "../lib/zodError";
import subjectsService from "../services/subjects.services";
import {
  subjectCreateSchema,
  subjectUpdateSchema,
} from "../validation/subjects.validation";

const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = subjectCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, extractMessagesFromFlatten(parsed.error));
  }

  const subject = await subjectsService.createSubject(parsed.data);

  return res
    .status(201)
    .json(new ApiResponse(201, subject, "Subject created successfully"));
});

const getSubjects = asyncHandler(async (req: Request, res: Response) => {
  const subjects = await subjectsService.getAllSubjects();

  return res
    .status(200)
    .json(new ApiResponse(200, subjects, "Subjects retrieved successfully"));
});

const getSubjectById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) {
    return res.status(400).json(new ApiError(400, "Subject ID is required"));
  }

  const subject = await subjectsService.getSubjectById(req.params.id);

  if (!subject) {
    return res.status(404).json(new ApiError(404, "Subject not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subject, "Subject retrieved successfully"));
});

const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) {
    return res.status(400).json(new ApiError(400, "Subject ID is required"));
  }

  const parsed = subjectUpdateSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, extractMessagesFromFlatten(parsed.error));
  }

  const existing = await subjectsService.getSubjectById(req.params.id);

  if (!existing) {
    return res.status(404).json(new ApiError(404, "Subject not found"));
  }

  const updated = await subjectsService.updateSubject(
    req.params.id,
    parsed.data,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Subject updated successfully"));
});

const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.params.id) {
    return res.status(400).json(new ApiError(400, "Subject ID is required"));
  }

  const existing = await subjectsService.getSubjectById(req.params.id);

  if (!existing) {
    return res.status(404).json(new ApiError(404, "Subject not found"));
  }

  await subjectsService.deleteSubject(req.params.id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id: req.params.id },
        "Subject deleted successfully",
      ),
    );
});

export {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
