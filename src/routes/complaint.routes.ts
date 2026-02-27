import express from "express";
import {
    createComplaint,
    getComplaints,
    updateComplaint,
    deleteComplaint,
} from "../controllers/complaint.controller";
import { complaintUpload } from "../configs/complaintMulter.config";
import { AuthorizationMiddleware } from "../middlewares/roleAuth.m";

const router = express.Router();

// All complaint routes require authentication
router.use(AuthorizationMiddleware);

router.post("/", complaintUpload.array("complaintImages", 5), createComplaint);
router.get("/", getComplaints);
router.put("/:id", complaintUpload.array("complaintImages", 5), updateComplaint);
router.delete("/:id", deleteComplaint);

export default router;
