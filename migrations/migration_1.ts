import { MongoCollections } from '../src/mongo';

export async function up(): Promise<void> {
  const streams = MongoCollections.getCollection('streams');

  const cursor = streams.find();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const record = await cursor.next();

    if (!record) {
      break;
    }

    if (!record.lastBitrate) {
      await streams.updateOne(
        {
          _id: record._id,
        },
        {
          $set: {
            lastBitrate: record.bitrate,
          },
        },
      );
    }
  }
}
