import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getActiveAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { announcementUpload } from '../configs/announcementMulter.config';
import {
  AuthorizationMiddleware,
  SuperAdminAuthorizationMiddleware,
} from '../middlewares/roleAuth.m';

const router = express.Router();

// Public route to get active announcements for the navbar
router.get('/active', getActiveAnnouncements);

// Protected routes
router.use(AuthorizationMiddleware);

// SuperAdmin only routes for management
router.get('/', SuperAdminAuthorizationMiddleware, getAnnouncements);
router.post(
  '/create',
  SuperAdminAuthorizationMiddleware,
  announcementUpload.single('file'),
  createAnnouncement,
);
router.put(
  '/update/:id',
  SuperAdminAuthorizationMiddleware,
  announcementUpload.single('file'),
  updateAnnouncement,
);
router.delete('/delete/:id', SuperAdminAuthorizationMiddleware, deleteAnnouncement);

export default router;
