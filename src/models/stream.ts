import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

import { schema } from '../schemas/stream';
import { IGenericStreamsResponse } from '../workers/_base';
import { IIPModel } from './ip';

export enum ApiSourceEnum {
  KOLPAQUE_RTMP = 'KOLPAQUE_RTMP',
  KOLPAQUE_ENCODE = 'KOLPAQUE_ENCODE',
  NODE_MEDIA_SERVER = 'NODE_MEDIA_SERVER',
  ADOBE_MEDIA_SERVER = 'ADOBE_MEDIA_SERVER',
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
  apiSource: string;
  apiResponse: IGenericStreamsResponse['channels'][0]['publisher'];
  createdAt: Date;
  updatedAt: Date;
  isLive: boolean;
  location?: IIPModel;
}

export const Stream = mongoose.model<IStreamModel>('Stream', schema);
