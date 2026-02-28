import express from "express";
import {
    getICTDLLabs,
    getICTDLabById,
    updateICTDLab,
    getICTDLFilterOptions,
    bulkICTDLInsert,
} from "../controllers/ictdl.controller";
import { labUpload } from "../configs/labMulter.config";

import { AuthorizationMiddleware } from "../middlewares/roleAuth.m";

const router = express.Router();

// Bulk insert is public for migration
router.post("/add/bulk", bulkICTDLInsert);

// All other routes are protected
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
