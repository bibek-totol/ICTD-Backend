// src/utils/AppError.util.ts
import { ErrorSeverity, ErrorSource } from "@prisma/client";
import { AppErrorPayload } from "../interfaces_and_types/AppError.interface";

export class AppError extends Error {
  statusCode: number;
  functionName?: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  originalError?: unknown;
  isOperational: boolean;

  constructor(payload: AppErrorPayload) {
    const resolvedMessage =
      payload.msg ||
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
        ? ErrorSeverity.CRITICAL
        : ErrorSeverity.MEDIUM;

    this.source = ErrorSource.API;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
