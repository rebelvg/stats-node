import { MongoClient } from 'mongodb';
import { URL } from 'url';
import moment from 'moment';

import { db } from '../config';

const mongoUrl = new URL(`mongodb://${db.host}/ams`);

if (db.authDb) {
  mongoUrl.username = encodeURIComponent(db.user);
  mongoUrl.password = encodeURIComponent(db.password);

  mongoUrl.searchParams.set('authSource', db.authDb);
}

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

MongoClient.connect(mongoUrl.href)
  .then(db => {
    const streams = (db as any).collection('streams');
    const subscribers = (db as any).collection('subscribers');

    // fs.writeFileSync('streams.json', JSON.stringify(await streams.find().toArray()));
    // fs.writeFileSync('subscribers.json', JSON.stringify(await subscribers.find().toArray()));
    //
    // console.log('done.');

    const cursor = streams
      .find()
      .sort({ timestamp: 1 })
      .stream();

    cursor.on('data', async data => {
      const stream = new Stream({
        app: data.app,
        channel: data.channel,
        serverId: data.id,
        connectCreated: moment.unix(data.timestamp),
        connectUpdated: moment.unix(data.stats.timestamp),
        bytes: data.stats.bytes_in,
        ip: data.stats.streamer_ip
      });

      await stream.save();

      stream.viewersCount = await subscribers.count({
        app: data.app,
        channel: data.channel,
        'stats.timestamp': { $gte: data.timestamp },
        timestamp: { $lte: data.stats.timestamp }
      });

      await stream.save();
    });

    cursor.on('end', () => {
      console.log('cursor stopped.');
    });

    const subscribersCursor = subscribers
      .find()
      .sort({ timestamp: 1 })
      .stream();

    subscribersCursor.on('data', async data => {
      const subscriber = new Subscriber({
        app: data.app,
        channel: data.channel,
        serverId: data.id,
        connectCreated: moment.unix(data.timestamp),
        connectUpdated: moment.unix(data.stats.timestamp),
        bytes: data.stats.bytes_out,
        ip: data.stats.client_ip
      });

      await subscriber.save();
    });

    subscribersCursor.on('end', () => {
      console.log('subscribersCursor stopped.');
    });
  })
  .catch(error => {
    console.error(error);
  });
