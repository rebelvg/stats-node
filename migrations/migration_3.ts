import { MongoCollections } from '../mongo';

export async function up(): Promise<void> {
  const ips = MongoCollections.getCollection('ips');

  await ips.updateMany({}, { $set: { isLocked: false } });
}
