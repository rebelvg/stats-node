import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const ips = mongoClient.collection<{ apiUpdatedAt: Date }>('ips');

  await ips.updateMany({}, { $set: { apiUpdatedAt: new Date() } });
}
