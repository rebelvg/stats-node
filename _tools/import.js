let MongoClient = require('mongodb').MongoClient;
const {URL} = require('url');
const moment = require('moment');
const fs = require('fs');

const {db, stats} = require('../config.json');

let mongoUrl = new URL(`mongodb://${db.host}/ams`);

if (db.authDb) {
    mongoUrl.username = encodeURIComponent(db.user);
    mongoUrl.password = encodeURIComponent(db.password);

    mongoUrl.searchParams.set('authSource', db.authDb);
}

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

MongoClient.connect(mongoUrl.href)
    .then(async db => {
        let streams = db.collection('streams');
        let subscribers = db.collection('subscribers');

        // fs.writeFileSync('streams.json', JSON.stringify(await streams.find().toArray()));
        // fs.writeFileSync('subscribers.json', JSON.stringify(await subscribers.find().toArray()));
        //
        // console.log('done.');

        let cursor = streams.find().sort({timestamp: 1}).stream();

        cursor.on('data', async function (data) {
            let stream = new Stream({
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
                'stats.timestamp': {$gte: data.timestamp},
                'timestamp': {$lte: data.stats.timestamp}
            });

            await stream.save();
        });

        cursor.on('end', function () {
            console.log('cursor stopped.');
        });

        let subscribersCursor = subscribers.find().sort({timestamp: 1}).stream();

        subscribersCursor.on('data', async function (data) {
            let subscriber = new Subscriber({
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

        subscribersCursor.on('end', function () {
            console.log('subscribersCursor stopped.');
        });
    })
    .catch(e => {
        console.log(e.stack);
    });
