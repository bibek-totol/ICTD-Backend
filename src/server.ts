import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import config from "./configs/env.config";
import { connectDatabase } from "./configs/prisma.config";
// import AuthRouter from "./routes/auth.routes";
import UserRouter from "./routes/user.routes";
import LabRouter from "./routes/lab.routes";
import AuthRouter from "./routes/auth.routes";
import LabReportRouter from "./routes/labReport.routes";
import ClassReportRouter from "./routes/classReport.routes";
import ICTDLRouter from "./routes/ictdl.routes";
import ComplaintRouter from "./routes/complaint.routes";
import AnnouncementRouter from "./routes/announcement.routes";
import NoticeRouter from "./routes/notice.routes";
import VendorRouter from "./routes/vendor.routes";
import ContactMessageRouter from "./routes/contactMessage.routes";
import FileRouter from "./routes/file.routes";
// import authenticateMiddleware from "./middlewares/auth.m";
import { requestLogger } from "./middlewares/logger.m";
import { errorHandler } from "./middlewares/errorHandler.m";
import cookieParser from "cookie-parser";
import { i18nMiddleware } from "./middlewares/i18n.middleware";

const app = express();

const serverPort = Number(config.port) || 4000;
const clientPort1 = 5173;
const clientPort2 = 5174;
const clientPort3 = 5175;

app.set("etag", false);
app.set("trust proxy", true);

const allowedOrigins = [
  config.base_url,
  `http://localhost:${clientPort1}`,
  `http://localhost:${clientPort2}`,
  `http://localhost:${clientPort3}`,
  `https://ictd-lab-gsi-project.vercel.app`,
  `https://ictd-lab-gsi-project-frontend.vercel.app`
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Range"],
    credentials: true,
  }),
);

app.use(requestLogger);
app.use(express.json({ limit: "1000mb" }));
app.use(express.urlencoded({ limit: "1000mb", extended: true }));

app.use(cookieParser());
app.use(i18nMiddleware);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: true, message: "Server is running" });
});

// app.use("/api/v1/auth", AuthRouter);
// app.use(authenticateMiddleware);
app.use("/api/v1/auth", AuthRouter);

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/labs", LabRouter);
app.use("/api/v1/lab-reports", LabReportRouter);
app.use("/api/v1/class-reports", ClassReportRouter);
app.use("/api/v1/ictdl", ICTDLRouter);
app.use("/api/v1/complaints", ComplaintRouter);
app.use("/api/v1/announcements", AnnouncementRouter);
app.use("/api/v1/notices", NoticeRouter);
app.use("/api/v1/vendors", VendorRouter);
app.use("/api/v1/contact-messages", ContactMessageRouter);
app.use("/api/v1/files", FileRouter);

app.use(errorHandler);

app.listen(serverPort, async () => {
  console.log(`🚀 Server started at http://localhost:${serverPort}`);
  await connectDatabase();
});
