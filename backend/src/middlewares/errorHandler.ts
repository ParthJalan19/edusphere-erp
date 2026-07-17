import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error & {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    errors?: Record<string, { message: string }>;
    code?: number;
    errmsg?: string;
  },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  // In development, we can print the stack trace for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', err);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((el: { message: string }) => el.message);
    res.status(400).json({
      success: false,
      data: null,
      error: {
        message: `Invalid input data: ${messages.join(', ')}`,
        status: 'fail',
      },
    });
    return;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const value = (err.errmsg || '').match(/(["'])(\\?.)*?\1/)?.[0] || '';
    res.status(400).json({
      success: false,
      data: null,
      error: {
        message: `Duplicate field value: ${value}. Please use another value!`,
        status: 'fail',
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        message: 'Invalid token. Please log in again!',
        status: 'fail',
      },
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      data: null,
      error: {
        message: 'Your token has expired! Please log in again.',
        status: 'fail',
      },
    });
    return;
  }

  // Generic fallback
  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message: err.isOperational ? err.message : 'Something went wrong on the server',
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
