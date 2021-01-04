import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

import { schema } from '../schemas/stream';
import { IGenericStreamsResponse } from '../workers/_base';

export enum ApiSourceEnum {
  KLPQ_MEDIA_SERVER = 'klpq_media_server',
  NODE_MEDIA_SERVER = 'node_media_server',
  ADOBE_MEDIA_SERVER = 'adobe_media_server',
}

export interface IStreamModel extends Document {
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
  lastBitrate: number;
  totalConnectionsCount: number;
  peakViewersCount: number;
  userId: ObjectId;
  apiSource: ApiSourceEnum;
  apiResponse: IGenericStreamsResponse['channels'][0]['publisher'];
  createdAt: Date;
  updatedAt: Date;
  isLive: boolean;
}

export const Stream = mongoose.model<IStreamModel>('Stream', schema);
