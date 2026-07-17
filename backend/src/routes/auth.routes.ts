import { Router } from 'express';
import {
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;
