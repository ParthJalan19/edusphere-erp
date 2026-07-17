import { Request } from 'express';
import { IUser } from './user.interface.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}
