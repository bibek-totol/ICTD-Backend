import express from "express";
import {
    createLabReport,
    getLabReports,
    deleteLabReport,
} from "../controllers/labReport.controller";

const router = express.Router();

router.post("/", createLabReport);
router.get("/", getLabReports);
router.delete("/:id", deleteLabReport);

export default router;
