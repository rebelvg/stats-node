import * as _ from 'lodash';

import { MongoCollections } from '../src/mongo';
import { IStreamModel } from '../src/models/stream';
import { IChannelModel } from '../src/models/channel';

export async function up(): Promise<void> {
  const channelsCollection =
    MongoCollections.getCollection<IChannelModel>('channels');
  const streamsCollection =
    MongoCollections.getCollection<IStreamModel>('streams');

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
