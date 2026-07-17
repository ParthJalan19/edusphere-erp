import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/appError.js';
import authRouter from './routes/auth.routes.js';
import academicRouter from './routes/academic.routes.js';
import attendanceRouter from './routes/attendance.routes.js';
import assignmentRouter from './routes/assignment.routes.js';
import fileRouter from './routes/file.routes.js';
import resultRouter from './routes/result.routes.js';
import timetableRouter from './routes/timetable.routes.js';
import notificationRouter from './routes/notification.routes.js';
import searchRouter from './routes/search.routes.js';

const app = express();

// 1. Security HTTP headers
app.use(helmet());

// 2. CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body parsers, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Cookie parser
app.use(cookieParser());

// 5. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 6. Limit requests from the same API (Rate Limiting)
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  message: {
    success: false,
    data: null,
    error: {
      message: 'Too many requests from this IP, please try again in 15 minutes.',
      status: 'fail',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API endpoints
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
});

// 7. Route handlers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/academic', academicRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/assignments', assignmentRouter);
app.use('/api/v1/files', fileRouter);
app.use('/api/v1/results', resultRouter);
app.use('/api/v1/timetable', timetableRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/search', searchRouter);

// 8. Catch-all route for undefined endpoints
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 9. Centralized error handling middleware
app.use(errorHandler);

export default app;
