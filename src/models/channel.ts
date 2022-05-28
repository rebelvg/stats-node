import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

import { schema } from '../schemas/channel';

export enum ChannelTypeEnum {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface IChannel {
  name: string;
  type: ChannelTypeEnum;
  channelCreatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChannelModel extends IChannel, Document {
  name: string;
  type: ChannelTypeEnum;
  createdAt: Date;
  updatedAt: Date;
}

export const Channel = mongoose.model<IChannelModel>('Channel', schema);
