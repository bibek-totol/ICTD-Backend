import express from "express";
import {
  getLabs,
  getFilterOptions,
  getLabById,
  updateLab,
  getAllLabsUnified,
  bulkLabInsert,
  getLabsPublic,
  getFilterOptionsPublic,
  getLabByIdPublic,
  getAllLabsUnifiedPublic,
} from "../controllers/lab.controller.js";
import { labUpload } from "../configs/labMulter.config";

import { AuthorizationMiddleware } from "../middlewares/roleAuth.m";

const router = express.Router();

// Public routes
router.post("/add/bulk", bulkLabInsert);
router.get("/public", getLabsPublic);
router.get("/filter-optionspublic", getFilterOptionsPublic);
router.get("/unified-labspublic", getAllLabsUnifiedPublic);
router.get("/:idpublic", getLabByIdPublic);



// All these routes require authentication to enforce role-based scoping
router.use(AuthorizationMiddleware);

router.get("/", getLabs);
router.get("/filter-options", getFilterOptions);
router.get("/unified-labs", getAllLabsUnified);
router.get("/:id", getLabById);

router.put("/update/:id", labUpload.fields([{ name: 'labImages', maxCount: 2 }, { name: 'institutionImages', maxCount: 2 }]), updateLab);

export default router;
