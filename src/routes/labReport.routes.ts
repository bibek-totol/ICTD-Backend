import express from 'express';
import {
  createLabReport,
  getLabReports,
  deleteLabReport,
} from '../controllers/labReport.controller';
import { upload } from '../configs/multer.config';
import { AuthorizationMiddleware } from '../middlewares/roleAuth.m';

const router = express.Router();

// All lab-report routes require authentication
router.use(AuthorizationMiddleware);

router.post('/', upload.array('storageImages', 10), createLabReport);
router.get('/', getLabReports);
router.delete('/:id', deleteLabReport);

export default router;
