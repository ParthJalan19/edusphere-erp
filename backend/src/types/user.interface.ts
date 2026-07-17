import { Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'Teacher' | 'Student';
  isActive: boolean;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string, userPassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;
