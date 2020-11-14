import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

import { schema } from '../schemas/stream';

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
  lastBitrate: number;
  totalConnectionsCount: number;
  peakViewersCount: number;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isLive: boolean;
  updateInfo: () => Promise<void>;
}

export const Stream = mongoose.model<IStreamModel>('Stream', schema);
