import * as _ from 'lodash';

import { MongoCollections } from '../src/mongo';
import { IStreamModel } from '../src/models/stream';
import { ChannelTypeEnum, IChannel } from '../src/models/channel';

export async function up(): Promise<void> {
  const channelsCollection =
    MongoCollections.getCollection<IChannel>('channels');

  const streamsCollection =
    MongoCollections.getCollection<IStreamModel>('streams');

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
