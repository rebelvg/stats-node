import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

import { schema } from '../schemas/user';

export interface IUserModel extends Document {
  googleId: string;
  name: string;
  ipCreated: string;
  ipUpdated: string;
  isAdmin: boolean;
  isStreamer: boolean;
  token: string;
  streamKey: string;
  createdAt: Date;
  updatedAt: Date;
  // eslint-disable-next-line @typescript-eslint/ban-types
  raw: Object;
}

export const User = mongoose.model<IUserModel>('User', schema);
