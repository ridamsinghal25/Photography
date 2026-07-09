import { ApiError } from "../lib/ApiError";
import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  // Keep existing ApiError untouched
  if (!(error instanceof ApiError)) {
    let statusCode: number = 500;
    let message: string = "Something went wrong";
    let errors: any[] = [];

    // MSSQL errors
    if (error?.code) {
      switch (error.code) {
        // Query syntax / constraint / validation errors
        case "EREQUEST":
          statusCode = 400;
          message = error.message || "Database request failed";
          break;

        // Connection timeout
        case "ETIMEOUT":
          statusCode = 504;
          message = "Database request timed out";
          break;

        // Login failed
        case "ELOGIN":
          statusCode = 503;
          message = "Database authentication failed";
          break;

        // Connection closed
        case "ECONNCLOSED":
        case "ENOTOPEN":
          statusCode = 503;
          message = "Database connection unavailable";
          break;

        default:
          statusCode = 500;
          message = error.message || message;
      }

      // SQL Server specific details
      if (error.number) {
        errors.push({
          sqlErrorNumber: error.number,
          sqlState: error.state,
          sqlClass: error.class,
        });
      }

    } else {
      // Generic JS errors
      statusCode =
        error.statusCode || 500;

      message =
        error.message || message;

      errors =
        error.errors || [];
    }

    error = new ApiError(
      statusCode,
      message,
      errors,
      err.stack
    );
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development"
      ? { stack: error.stack }
      : {}),
  };

  return res
    .status(error.statusCode)
    .json(response);
};

export { errorHandler };