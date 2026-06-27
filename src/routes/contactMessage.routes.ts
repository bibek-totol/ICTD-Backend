import express from 'express';
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessages,
  updateContactMessageStatus,
} from '../controllers/contactMessage.controller';
import {
  AuthorizationMiddleware,
  SuperAdminAuthorizationMiddleware,
} from '../middlewares/roleAuth.m';

const router = express.Router();

router.post('/', createContactMessage);

router.use(AuthorizationMiddleware);

router.get('/', SuperAdminAuthorizationMiddleware, getContactMessages);
router.patch('/:id', SuperAdminAuthorizationMiddleware, updateContactMessageStatus);
router.delete('/:id', SuperAdminAuthorizationMiddleware, deleteContactMessage);

export default router;
