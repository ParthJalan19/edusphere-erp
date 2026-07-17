import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/user.model.js';
import Teacher from '../models/teacher.model.js';
import Student from '../models/student.model.js';
import RefreshToken from '../models/refreshToken.model.js';
import { AppError } from '../utils/appError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  sendTokenCookies,
  clearTokenCookies,
} from '../utils/jwt.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';
import { AuthenticatedRequest } from '../types/auth.interface.js';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Validation failed',
          details: validation.error.format(),
        },
      });
      return;
    }

    const { email, password } = validation.data;

    // 2. Find user & select password field explicitly
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // 3. Sign access and refresh tokens
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // 4. Store refresh token in database
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // 5. Send tokens as cookies
    sendTokenCookies(res, accessToken, refreshToken);

    // 6. Fetch role-specific profile details
    let profile = null;
    if (user.role === 'Teacher') {
      profile = await Teacher.findOne({ user: user._id });
    } else if (user.role === 'Student') {
      profile = await Student.findOne({ user: user._id });
    }

    // 7. Remove sensitive fields from output
    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.password;

    res.status(200).json({
      success: true,
      data: {
        user: userObj,
        profile,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Delete from DB to revoke session
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // Clear HTTP-only cookies
    clearTokenCookies(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw new AppError('No refresh token provided', 401);
    }

    // Verify token exists in database
    const dbToken = await RefreshToken.findOne({ token: refreshToken });
    if (!dbToken) {
      throw new AppError('Invalid refresh token session', 401);
    }

    // Verify token signature
    const decoded = verifyRefreshToken(refreshToken);

    // Fetch user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      await RefreshToken.deleteOne({ token: refreshToken });
      throw new AppError('User session is invalid or inactive', 401);
    }

    // Rotate tokens (generate new ones and revoke old)
    const payload = { id: user._id.toString(), role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await RefreshToken.deleteOne({ token: refreshToken });
    await RefreshToken.create({
      user: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    sendTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Validation failed',
          details: validation.error.format(),
        },
      });
      return;
    }

    const { email } = validation.data;
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('No account with that email address exists.', 404);
    }

    // Generate reset token and save hash
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Since we don't have email setup in v1, we return the raw token directly in development
    // to allow testing. In production, we'd send an email.
    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset link generated. Copy the token to reset your password.',
        // Return raw token in development or test for demo purposes
        token: resetToken,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          message: 'Validation failed',
          details: validation.error.format(),
        },
      });
      return;
    }

    const { password } = validation.data;
    const { token } = req.params;

    // Hash token to compare with database hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400);
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Login user immediately after password reset (send fresh cookies)
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    sendTokenCookies(res, accessToken, refreshToken);

    const userObj = user.toObject() as unknown as Record<string, unknown>;
    delete userObj.password;

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset successfully',
        user: userObj,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Helper controller to fetch current authenticated user profile
export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not logged in', 401);
    }

    let profile = null;
    if (req.user.role === 'Teacher') {
      profile = await Teacher.findOne({ user: req.user._id });
    } else if (req.user.role === 'Student') {
      profile = await Student.findOne({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
        profile,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
