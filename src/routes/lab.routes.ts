import express from "express";
import {
  getLabs,
  getFilterOptions,
  getLabById,
  updateLab,
  getAllLabsUnified,
} from "../controllers/lab.controller.js";
import { labUpload } from "../configs/labMulter.config";

// import authorizeMiddleware from "../middlewares/role.m";
// import authenticateMiddleware from "../middlewares/auth.m";

const router = express.Router();

// router.get("/", newGetLabs);
router.get("/", getLabs);
router.get("/filter-options", getFilterOptions);
router.get("/unified-labs", getAllLabsUnified);
router.get("/:id", getLabById);
router.put("/update/:id", labUpload.fields([{ name: 'labImages', maxCount: 2 }, { name: 'institutionImages', maxCount: 2 }]), updateLab);

export default router;

