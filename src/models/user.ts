import {
  Collection,
  UpdateOptions,
  Document,
  ObjectId,
  OptionalId,
} from 'mongodb';
import { MongoCollections } from '../mongo';

export interface IUserModel {
  _id?: ObjectId;
  googleId: string;
  name: string;
  ipCreated: string;
  ipUpdated: string;
  isAdmin: boolean;
  isStreamer: boolean;
  token: string;
  streamKey: string;
  createdAt: Date;
  updatedAt: Date;
  raw: object;
}

class UserModel {
  private collection: Collection<IUserModel>;

  constructor() {
    this.collection = MongoCollections.getCollection<IUserModel>('users');
  }

  findOne(params: Partial<IUserModel>) {
    return this.collection.findOne(params);
  }

  updateOne(
    filter: Partial<IUserModel>,
    data: Partial<IUserModel>,
    options?: UpdateOptions,
  ) {
    return this.collection.updateOne(filter, data, options);
  }

  find(params: Partial<IUserModel>) {
    return this.collection.find(params).toArray();
  }

  async create(params: OptionalId<IUserModel>) {
    const user = await this.collection.insertOne(params);

    return this.collection.findOne({
      _id: user.insertedId,
    });
  }
}

export const User = new UserModel();
