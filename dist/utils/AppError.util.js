"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// src/utils/AppError.util.ts
const client_1 = require("@prisma/client");
class AppError extends Error {
    constructor(payload) {
        const resolvedMessage = payload.msg ||
            (payload.error instanceof Error
                ? payload.error.message
                : "Unexpected error occurred");
        super(resolvedMessage);
        this.statusCode = payload.scode ?? 500;
        // ✅ CONDITIONAL ASSIGNMENT (KEY FIX)
        if (payload.fnc !== undefined) {
            this.functionName = payload.fnc;
        }
        if (payload.error !== undefined) {
            this.originalError = payload.error;
        }
        this.severity =
            this.statusCode >= 500
                ? client_1.ErrorSeverity.CRITICAL
                : client_1.ErrorSeverity.MEDIUM;
        this.source = client_1.ErrorSource.API;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
