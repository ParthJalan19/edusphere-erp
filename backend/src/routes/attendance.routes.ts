import { Router } from 'express';
import {
  markAttendance,
  getStudentAttendance,
  getOfferingAttendance,
} from '../controllers/attendance.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Teacher-only marking & class audits
router.post('/', restrictTo('Teacher'), markAttendance);
router.get('/offering/:offeringId', restrictTo('Teacher'), getOfferingAttendance);

// View individual student history
router.get('/student/:studentId', getStudentAttendance);

export default router;
