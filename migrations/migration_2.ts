import { MongoCollections } from '../src/mongo';

export async function up(): Promise<void> {
  const ips = MongoCollections.getCollection('ips');

  await ips.updateMany({}, { $set: { apiUpdatedAt: new Date() } });
}
