import express from "express";
import { servePdfInline } from "../controllers/file.controller";

const router = express.Router();

// Public route to serve PDFs inline
router.get("/pdf", servePdfInline);

export default router;
