import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const streams = mongoClient.collection<{}>('streams');

  await streams.updateMany(
    {
      apiSource: { $exists: false },
    },
    {
      $set: {
        apiSource: null,
      },
    },
  );

  await streams.updateMany(
    {
      apiResponse: { $exists: false },
    },
    {
      $set: {
        apiResponse: null,
      },
    },
  );

  const subscribers = mongoClient.collection<{}>('subscribers');

  await subscribers.updateMany(
    {
      apiSource: { $exists: false },
    },
    {
      $set: {
        apiSource: null,
      },
    },
  );

  await subscribers.updateMany(
    {
      apiResponse: { $exists: false },
    },
    {
      $set: {
        apiResponse: null,
      },
    },
  );
}
