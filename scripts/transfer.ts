import { MongoClient } from 'mongodb';
import { URL } from 'url';
import * as moment from 'moment';
import * as mongoose from 'mongoose';

import { DB } from '../src/config';
import { Stream } from '../src/models/stream';
import { Subscriber } from '../src/models/subscriber';

const amsMongoUrl = new URL(`mongodb://${DB.HOST}`);

if (DB.AUTH_SOURCE) {
  amsMongoUrl.username = encodeURIComponent(DB.USER);
  amsMongoUrl.password = encodeURIComponent(DB.PASSWORD);

  amsMongoUrl.searchParams.set('authSource', DB.AUTH_SOURCE);
}

const nodeMongoUrl = new URL(`mongodb://${DB.HOST}`);

if (DB.AUTH_SOURCE) {
  nodeMongoUrl.username = encodeURIComponent(DB.USER);
  nodeMongoUrl.password = encodeURIComponent(DB.PASSWORD);

  nodeMongoUrl.searchParams.set('authSource', DB.AUTH_SOURCE);
}

mongoose.connect(nodeMongoUrl.href, { useMongoClient: true }, (error) => {
  if (error) {
    throw error;
  }
});

(async () => {
  const mongoClient = await MongoClient.connect(amsMongoUrl.href);

  const amsDb = mongoClient.db('ams');

  const amsIps = amsDb.collection('ips');
  const amsStreams = amsDb.collection('streams');
  const amsSubscribers = amsDb.collection('subscribers');

  const mongoClientNodeStats = await MongoClient.connect(nodeMongoUrl.href);

  const nodeDb = mongoClientNodeStats.db('nodestats');

  const nodeIPsCollection = nodeDb.collection('ips');

  const nodeIPs = await amsIps.find().toArray();

  for (const ip of nodeIPs) {
    try {
      await nodeIPsCollection.insertOne({
        ip: ip.ip,
        api: ip.ip_stats,
        createdAt: moment.unix(ip.timestamp).toDate(),
        updatedAt: moment.unix(ip.timestamp).toDate(),
      });
    } catch (error) {
      console.error(error);
    }
  }

  const nodeSubscribers = await amsSubscribers.find().toArray();

  for (const subscriber of nodeSubscribers) {
    const subDoc = new Subscriber({
      server: 'ams',
      app: subscriber.app,
      channel: subscriber.channel,
      connectId: subscriber.id,
      connectCreated: moment.unix(subscriber.timestamp).toDate(),
      connectUpdated: moment.unix(subscriber.stats.timestamp).toDate(),
      bytes: subscriber.stats.bytes_out,
      ip: subscriber.stats.client_ip,
      protocol: 'rtmp',
    });

    await subDoc.save();
  }

  const nodeStreams = await amsStreams.find().toArray();

  for (const stream of nodeStreams) {
    const streamDoc = new Stream({
      server: 'ams',
      app: stream.app,
      channel: stream.channel,
      connectId: stream.id,
      connectCreated: moment.unix(stream.timestamp).toDate(),
      connectUpdated: moment.unix(stream.stats.timestamp).toDate(),
      bytes: stream.stats.bytes_in,
      ip: stream.stats.streamer_ip,
      protocol: 'rtmp',
    });

    await streamDoc.save();
  }

  console.log('export done.');
})();
