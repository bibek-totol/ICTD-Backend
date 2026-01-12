import { Request, Response, NextFunction } from "express";
import AppRequest from "../interfaces_and_types/AppRequest.interface";
import { AppError } from "../utils/AppError.util";
import { logErrorToDB } from "../utils/errorLogger.util";

export const errorHandler = (
  err: Error,
  req: AppRequest | Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode =
    err instanceof AppError ? err.statusCode : 500;

  logErrorToDB(err, req, statusCode);

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
};
