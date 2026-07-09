import { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { asyncHandler } from "../lib/asyncHandler.js";
import appUsersService from "../services/appUsers.services";
import { ApiError } from "../lib/ApiError.js";

export const verifyToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    throw new ApiError(401, "Unauthorized access");
  }

  const user = await appUsersService.getUserByClerkId(userId);

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  req.user = user;
  next();
});
