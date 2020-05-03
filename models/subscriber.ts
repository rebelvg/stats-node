import mongoose from 'mongoose';
import { Document } from 'mongoose';

import { schema } from '../schemas/subscriber';
import { IUserModel } from './user';

export interface ISubscriberModel extends Document {
  app: string;
  channel: string;
  serverType: string;
  serverId: string;
  connectCreated: Date;
  connectUpdated: Date;
  bytes: number;
  ip: string;
  protocol: string;
  duration: number;
  userId: IUserModel;
  createdAt: Date;
  updatedAt: Date;
}

export const Subscriber = mongoose.model<ISubscriberModel>('Subscriber', schema);
