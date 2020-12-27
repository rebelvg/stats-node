import { MongoCollections } from '../src/mongo';
import { ISubscriberModel } from '../src/models/subscriber';
import { IStreamModel } from '../src/models/stream';

export async function up(): Promise<void> {
  const streams = MongoCollections.getCollection<IStreamModel>('streams');

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

  const subscribers = MongoCollections.getCollection<ISubscriberModel>(
    'subscribers',
  );

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
