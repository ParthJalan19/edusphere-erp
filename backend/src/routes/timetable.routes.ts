import { Router } from 'express';
import { getTimetable } from '../controllers/timetable.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getTimetable);

export default router;
