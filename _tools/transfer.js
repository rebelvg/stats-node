let MongoClient = require('mongodb').MongoClient;
const {URL} = require('url');
const moment = require('moment');
const fs = require('fs');
const _ = require('lodash');
const mongoose = require('mongoose');

mongoose.Promise = Promise;

const {db, stats} = require('../config.json');

let amsMongoUrl = new URL(`mongodb://${db.host}/ams`);

if (db.authDb) {
    amsMongoUrl.username = encodeURIComponent(db.user);
    amsMongoUrl.password = encodeURIComponent(db.password);

    amsMongoUrl.searchParams.set('authSource', db.authDb);
}

let nodeMongoUrl = new URL(`mongodb://${db.host}/${db.dbName}`);

if (db.authDb) {
    nodeMongoUrl.username = encodeURIComponent(db.user);
    nodeMongoUrl.password = encodeURIComponent(db.password);

    nodeMongoUrl.searchParams.set('authSource', db.authDb);
}

mongoose.connect(nodeMongoUrl.href, {useMongoClient: true}, function (error) {
    if (error) throw error;
});

MongoClient.connect(amsMongoUrl.href)
    .then(async db => {
        let amsIps = db.collection('ips');
        let amsStreams = db.collection('streams');
        let amsSubscribers = db.collection('subscribers');

        let nodeDB = await MongoClient.connect(nodeMongoUrl.href);

        let nodeIPsCollection = nodeDB.collection('ips');

        let nodeIPs = await amsIps.find().toArray();

        for (let ip of nodeIPs) {
            try {
                await nodeIPsCollection.insertOne({
                    ip: ip.ip,
                    api: ip.ip_stats,
                    createdAt: moment.unix(ip.timestamp).toDate(),
                    updatedAt: moment.unix(ip.timestamp).toDate()
                });
            }
            catch (e) {
                console.log(e.message);
            }
        }

        let nodeSubscribers = await amsSubscribers.find().toArray();

        const Subscriber = require('../models/subscriber');

        for (let subscriber of nodeSubscribers) {
            let subDoc = new Subscriber({
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

        let nodeStreams = await amsStreams.find().toArray();

        const Stream = require('../models/stream');

        for (let stream of nodeStreams) {
            let streamDoc = new Stream({
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
    .catch(console.log);
