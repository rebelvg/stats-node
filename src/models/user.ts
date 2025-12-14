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

  async create(params: OptionalId<IUserModel>) {
    const user = await this.collection.insertOne(params);

    return user.insertedId;
  }
}

export const User = new UserModel();
