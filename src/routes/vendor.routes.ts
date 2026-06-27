import express from 'express';
import {
  createVendor,
  deleteVendor,
  getActiveVendors,
  getVendors,
  updateVendor,
} from '../controllers/vendor.controller';
import {
  AuthorizationMiddleware,
  SuperAdminAuthorizationMiddleware,
} from '../middlewares/roleAuth.m';

const router = express.Router();

router.get('/active', getActiveVendors);

router.use(AuthorizationMiddleware);

router.get('/', SuperAdminAuthorizationMiddleware, getVendors);
router.post('/create', SuperAdminAuthorizationMiddleware, createVendor);
router.put('/update/:id', SuperAdminAuthorizationMiddleware, updateVendor);
router.delete('/delete/:id', SuperAdminAuthorizationMiddleware, deleteVendor);

export default router;
