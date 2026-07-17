import { Router } from 'express';
import {
  enterResultBulk,
  publishResults,
  getStudentGrades,
  getOfferingGrades,
} from '../controllers/result.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Teacher-only grading controls
router.post('/bulk', restrictTo('Teacher'), enterResultBulk);
router.patch('/publish', restrictTo('Teacher'), publishResults);
router.get('/offering/:offeringId', restrictTo('Teacher'), getOfferingGrades);

// Student grade cards
router.get('/student/:studentId', getStudentGrades);

export default router;
