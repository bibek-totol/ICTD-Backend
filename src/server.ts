import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import config from "./configs/env.config";
import { connectDatabase } from "./configs/prisma.config";
// import AuthRouter from "./routes/auth.routes";
import UserRouter from "./routes/user.routes";
import LabRouter from "./routes/lab.routes";
// import authenticateMiddleware from "./middlewares/auth.m";
import { requestLogger } from "./middlewares/logger.m";
import { errorHandler } from "./middlewares/errorHandler.m";

const app = express();

const serverPort = Number(config.port) || 4000;
const clientPort1 = 5173;
const clientPort2 = 5174;
const clientPort3 = 5175;

app.set("etag", false);
app.set("trust proxy", true); 

app.use(
  cors({
    origin: [
      config.base_url,
      `http://localhost:${clientPort1}`,
      `http://localhost:${clientPort2}`,
      `http://localhost:${clientPort3}`,
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: true, message: "Server is running" });
});


// app.use("/api/v1/auth", AuthRouter);
// app.use(authenticateMiddleware);
app.use("/api/v1/users", UserRouter);
app.use("/api/v1/labs", LabRouter);

app.use(errorHandler);

app.listen(serverPort, async () => {
  console.log(`🚀 Server started at http://localhost:${serverPort}`);
  await connectDatabase();
});