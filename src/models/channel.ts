import { Collection, UpdateOptions, FindOptions, ObjectId } from 'mongodb';
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
    data: Partial<Omit<IChannelModel, 'createdAt' | 'updatedAt'>>,
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

  find(params: Partial<IChannelModel>, options?: FindOptions) {
    return this.collection.find(params, options).toArray();
  }

  create(data: Omit<IChannelModel, 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date();

    return this.collection.insertOne({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

export const Channel = new ChannelModel();
