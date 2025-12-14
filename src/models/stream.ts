import {
  Collection,
  UpdateOptions,
  Document,
  ObjectId,
  FindOptions,
  Filter,
  OptionalId,
} from 'mongodb';

import { IGenericStreamsResponse } from '../workers/_base';
import { MongoCollections } from '../mongo';

export enum ApiSourceEnum {
  KOLPAQUE_RTMP = 'KOLPAQUE_RTMP',
  KOLPAQUE_ENCODE = 'KOLPAQUE_ENCODE',
  NODE_MEDIA_SERVER = 'NODE_MEDIA_SERVER',
  ADOBE_MEDIA_SERVER = 'ADOBE_MEDIA_SERVER',
}

export interface IStreamModel {
  _id?: ObjectId;
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
}

class StreamModel {
  private collection: Collection<IStreamModel>;

  constructor() {
    this.collection = MongoCollections.getCollection<IStreamModel>('streams');
  }

  findOne(params: Partial<IStreamModel>) {
    return this.collection.findOne(params);
  }

  updateOne(
    filter: Partial<IStreamModel>,
    data: Partial<IStreamModel>,
    options?: UpdateOptions,
  ) {
    return this.collection.updateOne(filter, data, options);
  }

  find(filter: Filter<IStreamModel>) {
    return this.collection.find(filter).toArray();
  }

  create(params: OptionalId<IStreamModel>) {
    return this.collection.insertOne(params);
  }

  async upsert(params: OptionalId<IStreamModel>) {
    if (params._id) {
      await this.collection.updateOne(
        {
          _id: params._id,
        },
        {
          ...params,
        },
      );
    } else {
      await this.collection.insertOne(params);
    }
  }
}

export const Stream = new StreamModel();
