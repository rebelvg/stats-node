import * as _ from 'lodash';

import { MongoCollections } from '../src/mongo';
import { IStreamModel } from '../src/models/stream';
import { ISubscriberModel } from '../src/models/subscriber';

export async function up(): Promise<void> {
  const streamsCollection =
    MongoCollections.getCollection<IStreamModel>('streams');
  const subscribersCollection =
    MongoCollections.getCollection<ISubscriberModel>('subscribers');

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
