import { MongoCollections } from '../mongo';

export async function up(): Promise<void> {
  const streams = MongoCollections.getCollection('streams');

  const cursor = streams.find();

  while (true) {
    const record = await cursor.next();

    if (!record) {
      break;
    }

    if (!record.lastBitrate) {
      await streams.updateOne(
        {
          _id: record._id
        },
        {
          $set: {
            lastBitrate: record.bitrate
          }
        }
      );
    }
  }
}
