"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logErrorToDB = void 0;
const AppError_util_1 = require("./AppError.util");
const prisma_config_1 = require("../configs/prisma.config");
const client_1 = require("@prisma/client");
const logErrorToDB = async (err, req, statusCode) => {
    try {
        const appError = err instanceof AppError_util_1.AppError ? err : null;
        await prisma_config_1.prisma.errorLog.create({
            data: {
                message: err.message,
                severity: appError?.severity ?? client_1.ErrorSeverity.CRITICAL,
                source: appError?.source ?? client_1.ErrorSource.SYSTEM,
                requestId: req.requestId ?? null,
                statusCode,
                method: req.method,
                path: req.originalUrl,
                ip: req.ip ?? null,
                userAgent: req.headers["user-agent"] ?? null,
                // function name stored safely
                errorCode: appError?.functionName ?? null,
                service: "api",
                environment: process.env.NODE_ENV ?? "development",
                timezone: "Asia/Dhaka",
                ...(process.env.NODE_ENV === "development" &&
                    err.stack && { stackTrace: err.stack }),
            },
        });
    }
    catch (loggingError) {
        console.error("Failed to persist error log", loggingError);
    }
};
exports.logErrorToDB = logErrorToDB;
