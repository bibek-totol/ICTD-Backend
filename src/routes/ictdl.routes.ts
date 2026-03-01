import express from "express";
import {
    getICTDLLabs,
    getICTDLabById,
    updateICTDLab,
    getICTDLFilterOptions,
    bulkICTDLInsert,
    getICTDLLabsPublic,
    getICTDLFilterOptionsPublic,
    getICTDLabByIdPublic,
} from "../controllers/ictdl.controller";
import { labUpload } from "../configs/labMulter.config";

import { AuthorizationMiddleware } from "../middlewares/roleAuth.m";

const router = express.Router();

// Bulk insert is public for migration
router.post("/add/bulk", bulkICTDLInsert);
router.get("/public", getICTDLLabsPublic);
router.get("/filter-optionspublic", getICTDLFilterOptionsPublic);
router.get("/:idpublic", getICTDLabByIdPublic);



// All these routes require authentication to enforce role-based scoping
router.use(AuthorizationMiddleware);

router.get("/", getICTDLLabs);
router.get("/filter-options", getICTDLFilterOptions);
router.get("/:id", getICTDLabById);

router.put(
    "/update/:id",
    labUpload.fields([
        { name: "labImages", maxCount: 2 },
        { name: "institutionImages", maxCount: 2 },
    ]),
    updateICTDLab
);

export default router;
