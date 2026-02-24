import express from "express";
import {
    createComplaint,
    getComplaints,
    updateComplaint,
    deleteComplaint,
} from "../controllers/complaint.controller";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.put("/:id", updateComplaint);
router.delete("/:id", deleteComplaint);

export default router;
