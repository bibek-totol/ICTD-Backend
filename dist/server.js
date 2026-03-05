"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_config_1 = __importDefault(require("./configs/env.config"));
const prisma_config_1 = require("./configs/prisma.config");
// import AuthRouter from "./routes/auth.routes";
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const lab_routes_1 = __importDefault(require("./routes/lab.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const labReport_routes_1 = __importDefault(require("./routes/labReport.routes"));
const ictdl_routes_1 = __importDefault(require("./routes/ictdl.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const announcement_routes_1 = __importDefault(require("./routes/announcement.routes"));
const notice_routes_1 = __importDefault(require("./routes/notice.routes"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
// import authenticateMiddleware from "./middlewares/auth.m";
const logger_m_1 = require("./middlewares/logger.m");
const errorHandler_m_1 = require("./middlewares/errorHandler.m");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const i18n_middleware_1 = require("./middlewares/i18n.middleware");
const app = (0, express_1.default)();
const serverPort = Number(env_config_1.default.port) || 4000;
const clientPort1 = 5173;
const clientPort2 = 5174;
const clientPort3 = 5175;
app.set("etag", false);
app.set("trust proxy", true);
const allowedOrigins = [
    env_config_1.default.base_url,
    `http://localhost:${clientPort1}`,
    `http://localhost:${clientPort2}`,
    `http://localhost:${clientPort3}`,
    `https://ictd-lab-gsi-project.vercel.app`,
    `https://ictd-lab-gsi-project-frontend.vercel.app`
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Range"],
    credentials: true,
}));
app.use(logger_m_1.requestLogger);
app.use(express_1.default.json({ limit: "1000mb" }));
app.use(express_1.default.urlencoded({ limit: "1000mb", extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(i18n_middleware_1.i18nMiddleware);
app.get("/", (req, res) => {
    res.status(200).json({ status: true, message: "Server is running" });
});
// app.use("/api/v1/auth", AuthRouter);
// app.use(authenticateMiddleware);
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/users", user_routes_1.default);
app.use("/api/v1/labs", lab_routes_1.default);
app.use("/api/v1/lab-reports", labReport_routes_1.default);
app.use("/api/v1/ictdl", ictdl_routes_1.default);
app.use("/api/v1/complaints", complaint_routes_1.default);
app.use("/api/v1/announcements", announcement_routes_1.default);
app.use("/api/v1/notices", notice_routes_1.default);
app.use("/api/v1/files", file_routes_1.default);
app.use(errorHandler_m_1.errorHandler);
app.listen(serverPort, async () => {
    console.log(`🚀 Server started at http://localhost:${serverPort}`);
    await (0, prisma_config_1.connectDatabase)();
});
