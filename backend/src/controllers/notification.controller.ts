import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.interface.js';
import Notification from '../models/notification.model.js';
import { AppError } from '../utils/appError.js';
import mongoose from 'mongoose';

// Helper to create notifications internally within server actions
export const createSystemNotification = async (
  recipient: string | mongoose.Types.ObjectId,
  title: string,
  message: string
): Promise<void> => {
  try {
    await Notification.create({
      recipient,
      title,
      message,
    });
  } catch (error) {
    console.error('Failed to trigger database notification system: 💥', error);
  }
};

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('User session expired', 401);
    }

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50); // cap at last 50 alerts

    res.status(200).json({
      success: true,
      data: notifications,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification alert not found', 404);
    }

    res.status(200).json({
      success: true,
      data: notification,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError('User session expired', 401);
    }

    await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });

    res.status(200).json({
      success: true,
      data: { message: 'All notifications marked as read' },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
