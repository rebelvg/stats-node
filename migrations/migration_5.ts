import { MongoCollections } from '../src/mongo';
import { ISubscriberModel } from '../src/models/subscriber';
import { IStreamModel } from '../src/models/stream';

export async function up(): Promise<void> {
  const streams = MongoCollections.getCollection<IStreamModel>('streams');

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
    MongoCollections.getCollection<ISubscriberModel>('subscribers');

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
