import _ from 'lodash';

import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const channelsCollection = mongoClient.collection<{
    name: string;
  }>('channels');
  const streamsCollection = mongoClient.collection<{
    connectCreated: Date;
  }>('streams');

  const cursor = channelsCollection.find();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const channelRecord = await cursor.next();

    if (!channelRecord) {
      break;
    }

    const streamRecord = await streamsCollection.findOne(
      {
        channel: channelRecord.name,
      },
      {
        sort: { connectCreated: 1 },
      },
    );

    if (!streamRecord) {
      break;
    }

    await channelsCollection.updateOne(
      {
        _id: channelRecord._id,
      },
      {
        $set: {
          channelCreatedAt: streamRecord.connectCreated,
        },
      },
    );
  }
}
