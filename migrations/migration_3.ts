import { IIPModel } from '../src/models/ip';
import { MongoCollections } from '../src/mongo';

export async function up(): Promise<void> {
  const ips = MongoCollections.getCollection<IIPModel>('ips');

  await ips.updateMany({}, { $set: { isLocked: false } });
}
