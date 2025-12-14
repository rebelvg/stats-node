import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const streams = mongoClient.collection<{
    lastBitrate: number;
    bitrate: number;
  }>('streams');

  const cursor = streams.find();

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
