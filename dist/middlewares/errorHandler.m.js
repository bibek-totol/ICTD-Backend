"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_util_1 = require("../utils/AppError.util");
const errorLogger_util_1 = require("../utils/errorLogger.util");
const errorHandler = (err, req, res, next) => {
    const statusCode = err instanceof AppError_util_1.AppError ? err.statusCode : 500;
    (0, errorLogger_util_1.logErrorToDB)(err, req, statusCode);
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Something went wrong"
            : err.message,
    });
};
exports.errorHandler = errorHandler;
