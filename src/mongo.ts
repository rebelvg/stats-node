import { MongoClient, Collection, Document } from 'mongodb';

import { DB_URI } from './config';

export interface IMigration {
  name: string;
  timeCreated: Date;
}

const client = new MongoClient(DB_URI);

const mongoClientDb = client.db();

export async function connectMongoDriver(): Promise<MongoClient> {
  await client.connect();

  return client;
}

export class MongoCollections {
  public static getCollection<T extends Document>(name: string): Collection<T> {
    return mongoClientDb.collection<T>(name);
  }

  public static get Migrations(): Collection<IMigration> {
    return mongoClientDb.collection<IMigration>('migrations');
  }
}
