import { randomUUID } from "crypto";
import { appLogger } from "../utils/logger.util";
import { Role } from "@prisma/client";
const TIME_ZONE = "Asia/Dhaka";
export const requestLogger = (req, res, next) => {
    if (req.path === "/favicon.ico") {
        return next();
    }
    const start = Date.now();
    const requestId = randomUUID();
    req.requestId = requestId;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    res.on("finish", () => {
        const durationMs = Date.now() - start;
        appLogger.info("HTTP Request", {
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
        role: Role.Anonymous,
        userId: "",
        requestId: requestId,
    };
    next();
};
