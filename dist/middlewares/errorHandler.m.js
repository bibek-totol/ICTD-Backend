import { AppError } from "../utils/AppError.util";
import { logErrorToDB } from "../utils/errorLogger.util";
export const errorHandler = (err, req, res, next) => {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    logErrorToDB(err, req, statusCode);
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Something went wrong"
            : err.message,
    });
};
