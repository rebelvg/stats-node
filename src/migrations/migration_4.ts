import { Db, ObjectId } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const subscribers = mongoClient.collection<{
    server: string;
    app: string;
    channel: string;
    connectCreated: Date;
    connectUpdated: Date;
  }>('subscribers');
  const streams = mongoClient.collection<{
    streamIds: ObjectId[];
  }>('streams');

  const cursor = subscribers.find();

  for await (const record of cursor) {
    const streamRecords = await streams
      .find({
        server: record.server,
        app: record.app,
        channel: record.channel,
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
