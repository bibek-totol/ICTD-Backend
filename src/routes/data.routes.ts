import express from 'express';
import {
  getDivisions,
  getDistricts,
  getUpazilas,
  getSrdData,
  getSrdData300,
} from '../controllers/data.controller';
import { AuthorizationMiddleware } from '../middlewares/roleAuth.m';

const router = express.Router();

// Public data routes
router.get('/srd-data', getSrdData);
router.get('/srd-data300', getSrdData300);

// Authenticated/Secure data routes
router.use(AuthorizationMiddleware);
router.get('/divisions', getDivisions);
router.get('/districts', getDistricts);
router.get('/upazilas', getUpazilas);

export default router;
