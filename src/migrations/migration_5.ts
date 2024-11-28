import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const streams = mongoClient.collection<Record<string, unknown>>('streams');

  await streams.updateMany(
    {},
    {
      $rename: {
        serverType: 'server',
        serverId: 'connectId',
      },
    },
  );

  const subscribers =
    mongoClient.collection<Record<string, unknown>>('subscribers');

  await subscribers.updateMany(
    {},
    {
      $rename: {
        serverType: 'server',
        serverId: 'connectId',
      },
    },
  );
}
