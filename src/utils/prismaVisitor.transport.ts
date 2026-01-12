import Transport from "winston-transport";
import {prisma} from "../configs/prisma.config";
import { LogLevel } from "@prisma/client";

export class PrismaVisitorTransport extends Transport {
  async log(info: any, callback: () => void) {
    setImmediate(() => this.emit("logged", info));

    try {
      const {
        level,
        message,
        requestId,
        method,
        path,
        statusCode,
        durationMs,
        ip,
        userAgent,
        device,
        service,
        environment,
        timezone,
      } = info;

      await prisma.visitorLog.create({
        data: {
          level: level.toUpperCase() as LogLevel,
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
    } catch (error) {
      // Never throw inside logger
      console.error("VisitorLog DB write failed:", error);
    }

    callback();
  }
}
