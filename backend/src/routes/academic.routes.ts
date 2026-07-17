import { Router } from 'express';
import {
  getSemesterOfferings,
  getSemesterOfferingById,
  getSemesters,
  getDepartments,
  getCourses,
  getSubjects,
  getClasses,
} from '../controllers/academic.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply auth guard to all academic routes
router.use(authenticate);

router.get('/offerings', getSemesterOfferings);
router.get('/offerings/:id', getSemesterOfferingById);
router.get('/semesters', getSemesters);
router.get('/departments', getDepartments);
router.get('/courses', getCourses);
router.get('/subjects', getSubjects);
router.get('/classes', getClasses);

export default router;
