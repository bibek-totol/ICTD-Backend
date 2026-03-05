import express from "express";
import { createNotice, getNotices, getActiveNotices, updateNotice, deleteNotice } from "../controllers/notice.controller";
import { noticeUpload } from "../configs/noticeMulter.config";
import { AuthorizationMiddleware, SuperAdminAuthorizationMiddleware } from "../middlewares/roleAuth.m";

const router = express.Router();

// Public route for active notices (AllNotice page, Notice section)
router.get("/active", getActiveNotices);

// Protected routes
router.use(AuthorizationMiddleware);

// SuperAdmin only routes for management
router.get("/", SuperAdminAuthorizationMiddleware, getNotices);
router.post("/create", SuperAdminAuthorizationMiddleware, noticeUpload.single("file"), createNotice);
router.put("/update/:id", SuperAdminAuthorizationMiddleware, noticeUpload.single("file"), updateNotice);
router.delete("/delete/:id", SuperAdminAuthorizationMiddleware, deleteNotice);

export default router;
