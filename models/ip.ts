import mongoose from 'mongoose';
import { Document } from 'mongoose';

import { schema } from '../schemas/ip';

export interface IPModel extends Document {
  ip: string;
  api: any;
  createdAt: Date;
  updatedAt: Date;
}

export const IP = mongoose.model<IPModel>('IP', schema);
