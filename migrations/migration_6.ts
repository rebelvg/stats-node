import { MongoCollections } from '../src/mongo';
import { ISubscriberModel } from '../src/models/subscriber';
import { IStreamModel } from '../src/models/stream';

export async function up(): Promise<void> {
  const streams = MongoCollections.getCollection<IStreamModel>('streams');

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

  const subscribers = MongoCollections.getCollection<ISubscriberModel>(
    'subscribers',
  );

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
