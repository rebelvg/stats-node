import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const streams = mongoClient.collection<{
    lastBitrate: number;
    bitrate: number;
  }>('streams');

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
