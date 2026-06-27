import express from 'express';
import {
  createClassReport,
  deleteClassReport,
  getClassReports,
  updateClassReport,
} from '../controllers/classReport.controller';
import { AuthorizationMiddleware } from '../middlewares/roleAuth.m';

const router = express.Router();

router.use(AuthorizationMiddleware);

router.post('/', createClassReport);
router.get('/', getClassReports);
router.patch('/:id', updateClassReport);
router.delete('/:id', deleteClassReport);

export default router;
