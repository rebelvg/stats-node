import {
  Collection,
  UpdateOptions,
  Document,
  ObjectId,
  Filter,
  OptionalId,
  FindOptions,
} from 'mongodb';
import { MongoCollections } from '../mongo';

import { IGenericStreamsResponse } from '../workers/_base';

export interface ISubscriberModel {
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
  userId: ObjectId | null;
  streamIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

class SubscriberModel {
  private collection: Collection<ISubscriberModel>;

  constructor() {
    this.collection =
      MongoCollections.getCollection<ISubscriberModel>('subscribers');
  }

  findOne(params: Partial<ISubscriberModel>) {
    return this.collection.findOne(params);
  }

  updateOne(
    filter: Partial<ISubscriberModel>,
    data: Partial<Omit<ISubscriberModel, 'createdAt' | 'updatedAt'>>,
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

  find(filter: Filter<ISubscriberModel>, options?: FindOptions) {
    return this.collection.find(filter, options).toArray();
  }

  aggregate(query: any[]) {
    return this.collection.aggregate(query).toArray();
  }

  async paginate(filter: Filter<ISubscriberModel>, options?: FindOptions) {
    return {
      docs: await this.collection.find(filter, options).toArray(),
      total: await this.collection.countDocuments(),
    };
  }

  distinct<T>(key: string, filter: Filter<ISubscriberModel>) {
    return this.collection.distinct(key, filter) as Promise<T[]>;
  }

  async create(data: Omit<ISubscriberModel, 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date();

    const { insertedId } = await this.collection.insertOne({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const record = await this.collection.findOne({ _id: insertedId });

    return record!;
  }
}

export const Subscriber = new SubscriberModel();
