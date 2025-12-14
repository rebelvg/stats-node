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
  userId: ObjectId;
  streamIds: ObjectId[];
  apiSource: string;
  apiResponse: IGenericStreamsResponse['channels'][0]['subscribers'][0];
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
    data: Partial<ISubscriberModel>,
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

  async upsert(params: OptionalId<ISubscriberModel>) {
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
    return this.collection.aggregate(query);
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
}

export const Subscriber = new SubscriberModel();
