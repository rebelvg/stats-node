import {
  Collection,
  UpdateOptions,
  Document,
  ObjectId,
  FindOptions,
  Filter,
  OptionalId,
  AggregateOptions,
  WithId,
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
  userId: ObjectId | null;
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

  find(filter: Filter<IStreamModel>, options?: FindOptions) {
    return this.collection.find(filter, options).toArray();
  }

  async upsert(params: OptionalId<IStreamModel>) {
    if (params._id) {
      await this.collection.updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            updatedAt: new Date(),
          },
        },
      );
    } else {
      await this.collection.insertOne(params);
    }
  }

  aggregate(query: any[]) {
    return this.collection.aggregate(query).toArray();
  }

  async paginate(filter: Filter<IStreamModel>, options?: FindOptions) {
    return {
      docs: await this.collection.find(filter, options).toArray(),
      total: await this.collection.countDocuments(),
    };
  }

  distinct<T>(key: string, filter: Filter<IStreamModel>) {
    return this.collection.distinct(key, filter) as Promise<T[]>;
  }

  async create(data: IStreamModel) {
    return this.collection.insertOne(data);
  }
}

export const Stream = new StreamModel();
