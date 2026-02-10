"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_util_1 = require("../utils/AppError.util");
const errorLogger_util_1 = require("../utils/errorLogger.util");
const errorHandler = (err, req, res, next) => {
    const statusCode = err instanceof AppError_util_1.AppError ? err.statusCode : 500;
    // Log error details to console for debugging
    console.error("❌ Error Handler Caught:", {
        message: err.message,
        statusCode,
        path: req.originalUrl,
        method: req.method,
        stack: err.stack,
        ...(err instanceof AppError_util_1.AppError && {
            functionName: err.functionName,
            originalError: err.originalError
        })
    });
    (0, errorLogger_util_1.logErrorToDB)(err, req, statusCode);
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Something went wrong"
            : err.message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
            ...(err instanceof AppError_util_1.AppError && {
                functionName: err.functionName
            })
        })
    });
};
exports.errorHandler = errorHandler;
