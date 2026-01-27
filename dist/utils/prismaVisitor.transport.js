"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaVisitorTransport = void 0;
const winston_transport_1 = __importDefault(require("winston-transport"));
const prisma_config_1 = require("../configs/prisma.config");
class PrismaVisitorTransport extends winston_transport_1.default {
    async log(info, callback) {
        setImmediate(() => this.emit("logged", info));
        try {
            const { level, message, requestId, method, path, statusCode, durationMs, ip, userAgent, device, service, environment, timezone, } = info;
            await prisma_config_1.prisma.visitorLog.create({
                data: {
                    level: level.toUpperCase(),
                    message,
                    requestId,
                    method,
                    path,
                    statusCode,
                    durationMs,
                    ip,
                    userAgent,
                    device,
                    service: service ?? "api",
                    environment: environment ?? process.env.NODE_ENV ?? "development",
                    timezone: timezone ?? "Asia/Dhaka",
                },
            });
        }
        catch (error) {
            // Never throw inside logger
            console.error("VisitorLog DB write failed:", error);
        }
        callback();
    }
}
exports.PrismaVisitorTransport = PrismaVisitorTransport;
