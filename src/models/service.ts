import { Collection, Filter, FindOptions, ObjectId } from 'mongodb';
import { MongoCollections } from '../mongo';
import { EnumProtocols } from '../helpers/interfaces';

export interface IServiceModel {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  protocol: EnumProtocols;
  origin: string;
  originUpdatedAt: Date;
}

class ServiceModel {
  private collection: Collection<IServiceModel>;

  constructor() {
    this.collection = MongoCollections.getCollection<IServiceModel>('services');
  }

  upsert(
    filter: Omit<
      IServiceModel,
      '_id' | 'originUpdatedAt' | 'createdAt' | 'updatedAt'
    >,
    data: Pick<IServiceModel, 'originUpdatedAt'>,
  ) {
    const timestamp = new Date();

    return this.collection.updateOne(
      filter,
      {
        $set: {
          ...data,
        },
        $setOnInsert: {
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      },
      {
        upsert: true,
      },
    );
  }

  find(params: Filter<IServiceModel>, options?: FindOptions) {
    return this.collection.find(params, options).toArray();
  }

  findOne(params: Filter<IServiceModel>, options?: FindOptions) {
    return this.collection.findOne(params, options);
  }
}

export const Service = new ServiceModel();
