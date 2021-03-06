import * as mongoose from 'mongoose';
import { MongoClient, Db, Collection } from 'mongodb';

import { DB } from './config';

(mongoose as any).Promise = Promise;

export async function connectMongoose() {
  await mongoose.connect(`mongodb://${DB.HOST}/${DB.NAME}`, {
    useMongoClient: true,
  });
}

export interface IMigration {
  name: string;
  timeCreated: Date;
}

let mongoClientDb: Db;

export async function connectMongoDriver(): Promise<MongoClient> {
  const client = await MongoClient.connect(`mongodb://${DB.HOST}`);

  mongoClientDb = client.db(DB.NAME);

  return client;
}

export class MongoCollections {
  public static getCollection<T>(name: string): Collection<T> {
    return mongoClientDb.collection<T>(name);
  }

  public static get Migrations(): Collection<IMigration> {
    return mongoClientDb.collection<IMigration>('migrations');
  }
}
