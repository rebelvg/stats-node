const MongoClient = require('mongodb').MongoClient;
const { URL } = require('url');
const moment = require('moment');
const mongoose = require('mongoose');

mongoose.Promise = Promise;

const { db } = require('../config');

const amsMongoUrl = new URL(`mongodb://${db.host}/ams`);

if (db.authDb) {
  amsMongoUrl.username = encodeURIComponent(db.user);
  amsMongoUrl.password = encodeURIComponent(db.password);

  amsMongoUrl.searchParams.set('authSource', db.authDb);
}

const nodeMongoUrl = new URL(`mongodb://${db.host}/${db.dbName}`);

if (db.authDb) {
  nodeMongoUrl.username = encodeURIComponent(db.user);
  nodeMongoUrl.password = encodeURIComponent(db.password);

  nodeMongoUrl.searchParams.set('authSource', db.authDb);
}

mongoose.connect(
  nodeMongoUrl.href,
  { useMongoClient: true },
  error => {
    if (error) {
      throw error;
    }
  }
);

MongoClient.connect(amsMongoUrl.href)
  .then(async amsDb => {
    const amsIps = amsDb.collection('ips');
    const amsStreams = amsDb.collection('streams');
    const amsSubscribers = amsDb.collection('subscribers');

    const nodeDB = await MongoClient.connect(nodeMongoUrl.href);

    const nodeIPsCollection = nodeDB.collection('ips');

    const nodeIPs = await amsIps.find().toArray();

    for (const ip of nodeIPs) {
      try {
        await nodeIPsCollection.insertOne({
          ip: ip.ip,
          api: ip.ip_stats,
          createdAt: moment.unix(ip.timestamp).toDate(),
          updatedAt: moment.unix(ip.timestamp).toDate()
        });
      } catch (error) {
        console.error(error);
      }
    }

    const nodeSubscribers = await amsSubscribers.find().toArray();

    const Subscriber = require('../models/subscriber');

    for (const subscriber of nodeSubscribers) {
      const subDoc = new Subscriber({
        app: subscriber.app,
        channel: subscriber.channel,
        serverType: 'ams',
        serverId: subscriber.id,
        connectCreated: moment.unix(subscriber.timestamp).toDate(),
        connectUpdated: moment.unix(subscriber.stats.timestamp).toDate(),
        bytes: subscriber.stats.bytes_out,
        ip: subscriber.stats.client_ip,
        protocol: 'rtmp'
      });

      await subDoc.save();
    }

    const nodeStreams = await amsStreams.find().toArray();

    const Stream = require('../models/stream');

    for (const stream of nodeStreams) {
      const streamDoc = new Stream({
        app: stream.app,
        channel: stream.channel,
        serverType: 'ams',
        serverId: stream.id,
        connectCreated: moment.unix(stream.timestamp).toDate(),
        connectUpdated: moment.unix(stream.stats.timestamp).toDate(),
        bytes: stream.stats.bytes_in,
        ip: stream.stats.streamer_ip,
        protocol: 'rtmp'
      });

      await streamDoc.save();

      await streamDoc.updateInfo();
      await streamDoc.save();
    }

    console.log('export done.');
  })
  .catch(error => {
    console.error(error);
  });
