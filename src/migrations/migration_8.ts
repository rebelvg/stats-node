import * as _ from 'lodash';

import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const channelsCollection = mongoClient.collection<{
    name: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
  }>('channels');

  const streamsCollection = mongoClient.collection<{ channel: string }>(
    'streams',
  );

  let channelNames: string[] = await streamsCollection.distinct('channel');

  channelNames = _(channelNames)
    .map((channelName) => channelName.toLowerCase())
    .uniq()
    .value();

  for (const channelName of channelNames) {
    await channelsCollection.insertOne({
      name: channelName,
      type: 'PRIVATE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
