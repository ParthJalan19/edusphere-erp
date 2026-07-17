import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.interface.js';
import User from '../models/user.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import { AppError } from '../utils/appError.js';
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  sendTokenCookies,
} from '../utils/jwt.js';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken, refreshToken } = req.cookies;

    // Case 1: Access Token is present and valid
    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        const currentUser = await User.findById(decoded.id);

        if (currentUser && currentUser.isActive) {
          // Check if password was changed after token was issued
          const isPasswordChanged = currentUser.changedPasswordAfter(decoded.iat || 0);
          if (!isPasswordChanged) {
            req.user = currentUser;
            return next();
          }
        }
      } catch {
        // If access token is invalid/expired, we fall through and check the refresh token
        if (process.env.NODE_ENV === 'development') {
          console.log('Access token verification failed, checking refresh token...');
        }
      }
    }

    // Case 2: Access Token is missing or expired, but Refresh Token is present
    if (!refreshToken) {
      throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    // Verify Refresh Token in database
    const dbToken = await RefreshToken.findOne({ token: refreshToken });
    if (!dbToken) {
      throw new AppError('Invalid or expired session. Please log in again.', 401);
    }

    // Verify Refresh Token signature
    let decodedRefresh;
    try {
      decodedRefresh = verifyRefreshToken(refreshToken);
    } catch {
      // Clean up invalid session from database
      await RefreshToken.deleteOne({ token: refreshToken });
      throw new AppError('Session expired. Please log in again.', 401);
    }

    // Fetch user
    const currentUser = await User.findById(decodedRefresh.id);
    if (!currentUser || !currentUser.isActive) {
      await RefreshToken.deleteOne({ token: refreshToken });
      throw new AppError(
        'The user belonging to this session no longer exists or is inactive.',
        401
      );
    }

    // Generate new tokens (rotational refresh tokens)
    const payload = { id: currentUser._id.toString(), role: currentUser.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    // Rotate refresh token in database
    await RefreshToken.deleteOne({ token: refreshToken });
    await RefreshToken.create({
      user: currentUser._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Send new tokens as cookies
    sendTokenCookies(res, newAccessToken, newRefreshToken);

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Restrict access to specific roles
export const restrictTo = (...roles: ('Teacher' | 'Student')[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
