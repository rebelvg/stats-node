import * as _ from 'lodash';

import { MongoCollections } from '../src/mongo';
import { ChannelTypeEnum } from '../src/models/channel';

export async function up(): Promise<void> {
  const channelsCollection =
    MongoCollections.getCollection<{
      name: string;
      type: string;
      createdAt: Date;
      updatedAt: Date;
    }>('channels');

  const streamsCollection = MongoCollections.getCollection<null>('streams');

  let channelNames: string[] = await streamsCollection.distinct('channel');

  channelNames = _(channelNames)
    .map((channelName) => channelName.toLowerCase())
    .uniq()
    .value();

  for (const channelName of channelNames) {
    await channelsCollection.insertOne({
      name: channelName,
      type: ChannelTypeEnum.PRIVATE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
