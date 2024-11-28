import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const streams = mongoClient.collection<Record<string, unknown>>('streams');

  await streams.updateMany(
    {
      userId: { $exists: false },
    },
    {
      $set: {
        userId: null,
      },
    },
  );

  const subscribers =
    mongoClient.collection<Record<string, unknown>>('subscribers');

  await subscribers.updateMany(
    {
      userId: { $exists: false },
    },
    {
      $set: {
        userId: null,
      },
    },
  );
}
