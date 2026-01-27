import express from "express";
import {
    createLabReport,
    getLabReports,
    deleteLabReport,
} from "../controllers/labReport.controller";
import { upload } from "../configs/multer.config";

const router = express.Router();

router.post("/", upload.array("storageImages", 10), createLabReport);
router.get("/", getLabReports);
router.delete("/:id", deleteLabReport);

export default router;
