import express from "express";
import {
  getLabs,
  getFilterOptions,
  getLabById,
  updateLab,
  getAllLabsUnified,
  bulkLabInsert,
} from "../controllers/lab.controller.js";
import { labUpload } from "../configs/labMulter.config";

import { AuthorizationMiddleware } from "../middlewares/roleAuth.m";

const router = express.Router();

// Bulk insert is public for migration
router.post("/add/bulk", bulkLabInsert);

router.get("/", getLabs);
router.get("/filter-options", getFilterOptions);
router.get("/unified-labs", getAllLabsUnified);
router.get("/:id", getLabById);

// All other routes are protected
router.use(AuthorizationMiddleware);

router.put("/update/:id", labUpload.fields([{ name: 'labImages', maxCount: 2 }, { name: 'institutionImages', maxCount: 2 }]), updateLab);

export default router;
