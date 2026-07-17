import jwt from 'jsonwebtoken';
import { Response } from 'express';

export interface TokenPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const signAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn: expiry as any });
};

export const signRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn: expiry as any });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.verify(token, secret) as TokenPayload;
};

export const sendTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Access Token cookie - 15 minutes
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins in ms
  });

  // Refresh Token cookie - 7 days
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

export const clearTokenCookies = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });
};
