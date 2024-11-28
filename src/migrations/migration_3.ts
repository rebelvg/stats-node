import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const ips = mongoClient.collection<{ isLocked: boolean }>('ips');

  await ips.updateMany({}, { $set: { isLocked: false } });
}
