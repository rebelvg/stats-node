import * as _ from 'lodash';

import { Db } from 'mongodb';

export async function up(mongoClient: Db): Promise<void> {
  const streamsCollection = mongoClient.collection<{}>('streams');
  const subscribersCollection = mongoClient.collection<{}>('subscribers');

  await streamsCollection.createIndex(
    {
      server: 1,
      app: 1,
      channel: 1,
      connectId: 1,
      connectCreated: 1,
    },
    { unique: true },
  );

  await subscribersCollection.createIndex(
    {
      server: 1,
      app: 1,
      channel: 1,
      connectId: 1,
      connectCreated: 1,
    },
    { unique: true },
  );
}
