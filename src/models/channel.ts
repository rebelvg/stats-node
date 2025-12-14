import {
  Collection,
  UpdateOptions,
  Document,
  OptionalId,
  FindOptions,
  ObjectId,
} from 'mongodb';
import { MongoCollections } from '../mongo';

export enum ChannelTypeEnum {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface IChannelModel {
  _id?: ObjectId;
  name: string;
  type: ChannelTypeEnum;
  createdAt: Date;
  updatedAt: Date;
  channelCreatedAt: Date;
}

class ChannelModel {
  private collection: Collection<IChannelModel>;

  constructor() {
    this.collection = MongoCollections.getCollection<IChannelModel>('channels');
  }

  findOne(params: Partial<IChannelModel>) {
    return this.collection.findOne(params);
  }

  updateOne(
    filter: Partial<IChannelModel>,
    data: Partial<IChannelModel>,
    options?: UpdateOptions,
  ) {
    return this.collection.updateOne(filter, data, options);
  }

  find(params: Partial<IChannelModel>, options?: FindOptions) {
    return this.collection.find(params, options).toArray();
  }

  create(params: OptionalId<IChannelModel>) {
    return this.collection.insertOne(params);
  }
}

export const Channel = new ChannelModel();
