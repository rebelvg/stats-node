import { MongoClient, Db, Collection } from 'mongodb';

import { DB_URI } from './config';

export interface IMigration {
  name: string;
  timeCreated: Date;
}

let mongoClientDb: Db;

export async function connectMongoDriver(): Promise<MongoClient> {
  const client = await MongoClient.connect(DB_URI);

  mongoClientDb = client.db();

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
