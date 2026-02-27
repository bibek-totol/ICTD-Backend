import express, { Request, Response } from "express";
import * as Auth from "../controllers/auth.controller";
import { AuthorizationMiddleware } from "../middlewares/roleAuth.m";

const router = express.Router();

router.post("/signup", Auth.signup);

router.post("/signin", Auth.signin);

router.post("/verify/email", Auth.verifyEmail);

router.post("/verify/code", Auth.verifyEmailCode);

// Protected route: get current user profile
router.get("/me", AuthorizationMiddleware, Auth.getMe);
router.post("/logout", Auth.logout);
export default router;
