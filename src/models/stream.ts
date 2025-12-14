import {
  Collection,
  UpdateOptions,
  ObjectId,
  FindOptions,
  Filter,
} from 'mongodb';

import { MongoCollections } from '../mongo';

export enum ApiSourceEnum {
  KOLPAQUE_RTMP = 'KOLPAQUE_RTMP',
  KOLPAQUE_ENCODE = 'KOLPAQUE_ENCODE',
  NODE_MEDIA_SERVER = 'NODE_MEDIA_SERVER',
  ADOBE_MEDIA_SERVER = 'ADOBE_MEDIA_SERVER',
}

export interface IStreamModel {
  _id: ObjectId;
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
    data: Partial<Omit<IStreamModel, 'createdAt' | 'updatedAt'>>,
    options?: UpdateOptions,
  ) {
    return this.collection.updateOne(
      filter,
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      },
      options,
    );
  }

  find(filter: Filter<IStreamModel>, options?: FindOptions) {
    return this.collection.find<IStreamModel>(filter, options).toArray();
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

  create(data: Omit<IStreamModel, '_id' | 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date();

    return this.collection.insertOne({
      ...data,
      _id: new ObjectId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

export const Stream = new StreamModel();
