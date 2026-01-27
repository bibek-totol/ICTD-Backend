import winston from "winston";
import { PrismaVisitorTransport } from "./prismaVisitor.transport";
const { combine, timestamp, json, colorize, printf } = winston.format;
const isProduction = process.env.NODE_ENV === "production";
export const appLogger = winston.createLogger({
    level: isProduction ? "info" : "debug",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), json()),
    transports: [
        // 🔹 Visitor logs (file)
        new winston.transports.File({
            filename: "logs/visitor.log",
        }),
        // 🔹 Error logs
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
        // 🔹 App logs
        new winston.transports.File({
            filename: "logs/app.log",
        }),
        // 🔹 Prisma VisitorLog (DB)
        new PrismaVisitorTransport(),
    ],
});
if (!isProduction) {
    appLogger.add(new winston.transports.Console({
        format: combine(colorize(), printf(({ level, message, timestamp, ...meta }) => {
            return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`;
        })),
    }));
}
