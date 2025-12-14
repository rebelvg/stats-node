import {
  Collection,
  UpdateOptions,
  ObjectId,
  Filter,
  FindOptions,
} from 'mongodb';
import { MongoCollections } from '../mongo';

export interface IIPModel {
  _id?: ObjectId;
  ip: string;
  api: {
    as: string;
    city: string;
    country: string;
    countryCode: string;
    isp: string;
    lat: number;
    lon: number;
    org: string;
    query: string;
    region: string;
    regionName: string;
    status: string;
    timezone: string;
    zip: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
  apiUpdatedAt: Date;
  isLocked: boolean;
}

class IPModel {
  private collection: Collection<IIPModel>;

  constructor() {
    this.collection = MongoCollections.getCollection<IIPModel>('ips');
  }

  findOne(params: Partial<IIPModel>) {
    return this.collection.findOne(params);
  }

  updateOne(
    filter: Partial<IIPModel>,
    data: Partial<Omit<IIPModel, 'createdAt' | 'updatedAt'>>,
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

  distinct<T>(key: string, filter: Filter<IIPModel>) {
    return this.collection.distinct(key, filter) as Promise<T[]>;
  }

  find(filter: Filter<IIPModel>, options?: FindOptions) {
    return this.collection.find(filter, options).toArray();
  }

  async paginate(filter: Filter<IIPModel>, options?: FindOptions) {
    return {
      docs: await this.collection.find(filter, options).toArray(),
      total: await this.collection.countDocuments(),
    };
  }

  create(data: Omit<IIPModel, 'createdAt' | 'updatedAt'>) {
    const timestamp = new Date();

    return this.collection.insertOne({
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

export const IP = new IPModel();
