import mongoose from 'mongoose';
import { Document } from 'mongoose';

import { schema } from '../schemas/user';

export interface IUserModel extends Document {
  googleId: string;
  emails: any[];
  name: string;
  ipCreated: string;
  ipUpdated: string;
  isAdmin: boolean;
  isStreamer: boolean;
  token: string;
  streamKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export const User = mongoose.model<IUserModel>('User', schema);
