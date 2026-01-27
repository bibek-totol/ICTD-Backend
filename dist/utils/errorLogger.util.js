import { AppError } from "./AppError.util";
import { prisma } from "../configs/prisma.config";
import { ErrorSeverity, ErrorSource } from "@prisma/client";
export const logErrorToDB = async (err, req, statusCode) => {
    try {
        const appError = err instanceof AppError ? err : null;
        await prisma.errorLog.create({
            data: {
                message: err.message,
                severity: appError?.severity ?? ErrorSeverity.CRITICAL,
                source: appError?.source ?? ErrorSource.SYSTEM,
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
