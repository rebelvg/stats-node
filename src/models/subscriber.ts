import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

import { schema } from '../schemas/subscriber';

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
  bitrate: number;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isLive: boolean;
}

export const Subscriber = mongoose.model<ISubscriberModel>(
  'Subscriber',
  schema,
);
