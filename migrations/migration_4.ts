import { MongoCollections } from '../src/mongo';
import { ISubscriberModel } from '../src/models/subscriber';
import { IStreamModel } from '../src/models/stream';

export async function up(): Promise<void> {
  const subscribers = MongoCollections.getCollection<ISubscriberModel>(
    'subscribers',
  );
  const streams = MongoCollections.getCollection<IStreamModel>('streams');

  const cursor = subscribers.find();

  for await (const record of cursor) {
    const streamRecords = await streams
      .find({
        app: record.app,
        channel: record.channel,
        serverType: record.serverType,
        connectUpdated: { $gte: record.connectCreated },
        connectCreated: { $lte: record.connectUpdated },
      })
      .toArray();

    await subscribers.updateOne(
      {
        _id: record._id,
      },
      {
        $set: {
          streamIds: streamRecords.map((streamRecord) => streamRecord._id),
        },
      },
    );
  }
}
