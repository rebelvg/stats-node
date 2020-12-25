import { MongoClient } from 'mongodb';
import { URL } from 'url';
import * as moment from 'moment';

import { DB } from '../config';
import { Stream } from '../src/models/stream';
import { Subscriber } from '../src/models/subscriber';

const mongoUrl = new URL(`mongodb://${DB.HOST}`);

if (DB.AUTH_SOURCE) {
  mongoUrl.username = encodeURIComponent(DB.USER);
  mongoUrl.password = encodeURIComponent(DB.PASSWORD);

  mongoUrl.searchParams.set('authSource', DB.AUTH_SOURCE);
}

(async () => {
  const mongoClient = await MongoClient.connect(mongoUrl.href);

  const db = mongoClient.db('ams');

  const streams = db.collection('streams');
  const subscribers = db.collection('subscribers');

  // fs.writeFileSync('streams.json', JSON.stringify(await streams.find().toArray()));
  // fs.writeFileSync('subscribers.json', JSON.stringify(await subscribers.find().toArray()));
  // console.log('done.');

  const cursor = streams.find().sort({ timestamp: 1 }).stream();

  cursor.on('data', async (data) => {
    const stream = new Stream({
      app: data.app,
      channel: data.channel,
      serverId: data.id,
      connectCreated: moment.unix(data.timestamp).toDate(),
      connectUpdated: moment.unix(data.stats.timestamp).toDate(),
      bytes: data.stats.bytes_in,
      ip: data.stats.streamer_ip,
    });

    await stream.save();

    stream.totalConnectionsCount = await subscribers.count({
      app: data.app,
      channel: data.channel,
      'stats.timestamp': { $gte: data.timestamp },
      timestamp: { $lte: data.stats.timestamp },
    });

    await stream.save();
  });

  cursor.on('end', () => {
    console.log('cursor stopped.');
  });

  const subscribersCursor = subscribers.find().sort({ timestamp: 1 }).stream();

  subscribersCursor.on('data', async (data) => {
    const subscriber = new Subscriber({
      app: data.app,
      channel: data.channel,
      serverId: data.id,
      connectCreated: moment.unix(data.timestamp).toDate(),
      connectUpdated: moment.unix(data.stats.timestamp).toDate(),
      bytes: data.stats.bytes_out,
      ip: data.stats.client_ip,
    });

    await subscriber.save();
  });

  subscribersCursor.on('end', () => {
    console.log('subscribersCursor stopped.');
  });
})();
