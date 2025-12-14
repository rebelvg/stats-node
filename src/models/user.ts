import {
  Collection,
  UpdateOptions,
  Document,
  ObjectId,
  OptionalId,
  FindOptions,
  Filter,
} from 'mongodb';
import { MongoCollections } from '../mongo';

export interface IUserModel {
  _id?: ObjectId;
  googleId: string | null;
  email: string | null;
  name: string | null;
  ipCreated: string;
  ipUpdated: string;
  isAdmin: boolean;
  isStreamer: boolean;
  token: string;
  streamKey: string;
  createdAt: Date;
  updatedAt: Date;
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
    data: Partial<Omit<IUserModel, 'createdAt' | 'updatedAt'>>,
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

  find(params: Filter<IUserModel>, options?: FindOptions) {
    return this.collection.find(params, options).toArray();
  }

  async create(data: Omit<IUserModel, 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date();

    return this.collection.insertOne({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

export const User = new UserModel();
