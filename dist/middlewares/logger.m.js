"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const crypto_1 = require("crypto");
const logger_util_1 = require("../utils/logger.util");
const client_1 = require("@prisma/client");
const TIME_ZONE = "Asia/Dhaka";
const requestLogger = (req, res, next) => {
    if (req.path === "/favicon.ico") {
        return next();
    }
    const start = Date.now();
    const requestId = (0, crypto_1.randomUUID)();
    req.requestId = requestId;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    res.on("finish", () => {
        const durationMs = Date.now() - start;
        logger_util_1.appLogger.info("HTTP Request", {
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            ip,
            userAgent,
            device: isMobile ? "mobile" : "desktop",
            service: "api",
            environment: process.env.NODE_ENV,
            timezone: TIME_ZONE,
        });
    });
    req.user = {
        role: client_1.Role.Anonymous,
        userId: "",
        requestId: requestId,
    };
    next();
};
exports.requestLogger = requestLogger;
