import * as mongoose from 'mongoose';
import { URL } from 'url';
import { MongoClient, Db, Collection } from 'mongodb';

import { db } from './config';

(mongoose as any).Promise = Promise;

const mongoUrl = new URL(`mongodb://${db.host}/${db.dbName}`);

export async function connectMongoose() {
  await mongoose.connect(mongoUrl.href, { useMongoClient: true });
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

  public static get migrations(): Collection<IMigration> {
    return mongoClientDb.collection<IMigration>('migrations');
  }
}
