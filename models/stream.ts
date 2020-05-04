import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

import { schema } from '../schemas/stream';
import { IUserModel } from './user';

export interface IStreamModel extends Document {
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
  totalConnectionsCount: number;
  peakViewersCount: number;
  userId: IUserModel;
  createdAt: Date;
  updatedAt: Date;
  getSubscribers: (query?: any) => mongoose.DocumentQuery<IStreamModel[], IStreamModel>;
  getRelatedStreams: (query?: any) => mongoose.DocumentQuery<IStreamModel[], IStreamModel>;
  isLive: boolean;
}

export const Stream = mongoose.model<IStreamModel>('Stream', schema);
