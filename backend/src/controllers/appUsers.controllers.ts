import { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { ApiResponse } from "../lib/ApiResponse";

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});
