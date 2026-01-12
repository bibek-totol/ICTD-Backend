import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.m"; // your custom type

const authorizeMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not found",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin only",
    });
  }

  next();
};

export default authorizeMiddleware;
