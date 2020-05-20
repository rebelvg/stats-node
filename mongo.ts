import * as mongoose from 'mongoose';
import { MongoClient, Db, Collection } from 'mongodb';

import { db } from './config';

(mongoose as any).Promise = Promise;

export async function connectMongoose() {
  await mongoose.connect(`mongodb://${db.host}/${db.dbName}`, { useMongoClient: true });
}

export interface IMigration {
  name: string;
  timeCreated: Date;
}

let mongoClientDb: Db;

export async function connectMongoDriver(): Promise<MongoClient> {
  const client = await MongoClient.connect(`mongodb://${db.host}`);

  mongoClientDb = client.db(db.dbName);

  return client;
}

export class MongoCollections {
  public static getCollection(name: string): Collection {
    return mongoClientDb.collection(name);
  }

  public static get Migrations(): Collection<IMigration> {
    return mongoClientDb.collection<IMigration>('migrations');
  }
}
