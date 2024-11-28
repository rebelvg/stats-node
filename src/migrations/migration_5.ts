import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const streams = mongoClient.collection<{}>('streams');

  await streams.updateMany(
    {},
    {
      $rename: {
        serverType: 'server',
        serverId: 'connectId',
      },
    },
  );

  const subscribers = mongoClient.collection<{}>('subscribers');

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
