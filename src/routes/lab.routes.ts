import express from 'express';
import {
  getLabs,
  getFilterOptions,
  getUnifiedFilterOptions,
  getLabById,
  updateLab,
  getAllLabsUnified,
  bulkLabInsert,
  getLabsPublic,
  getFilterOptionsPublic,
  getLabByIdPublic,
  getAllLabsUnifiedPublic,
} from '../controllers/lab.controller';
import { labUpload } from '../configs/labMulter.config';

import { AuthorizationMiddleware } from '../middlewares/roleAuth.m';

const router = express.Router();

// Public routes
router.post('/add/bulk', bulkLabInsert);
router.get('/public', getLabsPublic);
router.get('/filter-options/public', getFilterOptionsPublic);
router.get('/unified-labs/public', getAllLabsUnifiedPublic);
router.get('/:id/public', getLabByIdPublic);

// All these routes require authentication to enforce role-based scoping
router.use(AuthorizationMiddleware);

router.get('/', getLabs);
router.get('/filter-options', getFilterOptions);
router.get('/unified-filter-options', getUnifiedFilterOptions);
router.get('/unified-labs', getAllLabsUnified);
router.get('/:id', getLabById);

router.put(
  '/update/:id',
  labUpload.fields([
    { name: 'labImages', maxCount: 2 },
    { name: 'institutionImages', maxCount: 2 },
  ]),
  updateLab,
);

export default router;
