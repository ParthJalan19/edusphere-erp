import { Router } from 'express';
import {
  createAssignment,
  getAssignmentsByOffering,
  getStudentAssignments,
  getAssignmentSubmissions,
  submitAssignment,
  gradeSubmission,
} from '../controllers/assignment.controller.js';
import { authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// List/create assignments per class
router.get('/offering/:offeringId', getAssignmentsByOffering);
router.post('/', restrictTo('Teacher'), createAssignment);

// Student queries & file uploads
router.get('/student/:studentId', getStudentAssignments);
router.post('/submit', restrictTo('Student'), submitAssignment);

// Grading & auditing
router.get('/:assignmentId/submissions', restrictTo('Teacher'), getAssignmentSubmissions);
router.patch('/:submissionId/grade', restrictTo('Teacher'), gradeSubmission);

export default router;
