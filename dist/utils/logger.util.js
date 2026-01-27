"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const prismaVisitor_transport_1 = require("./prismaVisitor.transport");
const { combine, timestamp, json, colorize, printf } = winston_1.default.format;
const isProduction = process.env.NODE_ENV === "production";
exports.appLogger = winston_1.default.createLogger({
    level: isProduction ? "info" : "debug",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
    transports: [
        // 🔹 Visitor logs (file)
        // new winston.transports.File({
        //   filename: "logs/visitor.log",
        // }),
        // // 🔹 Error logs
        // new winston.transports.File({
        //   filename: "logs/error.log",
        //   level: "error",
        // }),
        // // 🔹 App logs
        // new winston.transports.File({
        //   filename: "logs/app.log",
        // }),
        // 🔹 Prisma VisitorLog (DB)
        new prismaVisitor_transport_1.PrismaVisitorTransport(),
    ],
});
if (!isProduction) {
    exports.appLogger.add(new winston_1.default.transports.Console({
        format: combine(colorize(), printf(({ level, message, timestamp, ...meta }) => {
            return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`;
        })),
    }));
}
