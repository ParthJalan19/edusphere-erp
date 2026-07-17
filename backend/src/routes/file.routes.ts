import { Router } from 'express';
import {
  upload,
  uploadFile,
  createNote,
  getNotesByOffering,
  downloadFileLocal,
  getSignedUrl,
} from '../controllers/file.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Serving files locally doesn't strictly need API headers if browser downloads it direct
router.get('/download/:filename', downloadFileLocal);

// Auth protected endpoints
router.use(authenticate);

router.post('/upload', upload.single('file'), uploadFile);
router.post('/signed-url', getSignedUrl);
router.get('/offering/:offeringId', getNotesByOffering);
router.post('/notes', restrictTo('Teacher'), createNote);

export default router;
