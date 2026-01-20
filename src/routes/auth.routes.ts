import express, { Request, Response } from "express";
import * as Auth from "../controllers/auth.controller";

const router = express.Router();

router.post("/signup", Auth.signup);

router.post("/signin", Auth.signin);

router.post("/verify/email", Auth.verifyEmail);

router.post("/verify/code", Auth.verifyEmailCode);

export default router;
