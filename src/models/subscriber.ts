import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

import { schema } from '../schemas/subscriber';
import { ApiSourceEnum } from './stream';
import { IGenericStreamsResponse } from '../workers/_base';

export interface ISubscriberModel extends Document {
  server: string;
  app: string;
  channel: string;
  connectId: string;
  connectCreated: Date;
  connectUpdated: Date;
  bytes: number;
  ip: string;
  protocol: string;
  duration: number;
  bitrate: number;
  userId: ObjectId;
  streamIds: ObjectId[];
  apiSource: ApiSourceEnum;
  apiResponse: IGenericStreamsResponse['app']['channel']['subscribers'][0];
  createdAt: Date;
  updatedAt: Date;
  isLive: boolean;
}

export const Subscriber = mongoose.model<ISubscriberModel>(
  'Subscriber',
  schema,
);
