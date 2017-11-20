const request = require('request-promise-native');
const _ = require('lodash');
const {URL} = require('url');

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

const nmsConfig = require('../config.json').nms;

const nodeHost = nmsConfig.host;

async function getNodeStats() {
    let apiUrl = new URL(`http://${nodeHost}/channels`);

    let res = await request.get(apiUrl.href, {
        resolveWithFullResponse: true,
        json: true
    });

    return res.body;
}

async function updateStats() {
    let channels = await getNodeStats();

    let statsUpdateTime = new Date();

    for (let appData of Object.values(channels)) {
        for (let channelData of Object.values(appData)) {
            let streamObj = null;

            if (channelData.publisher) {
                let streamQuery = {
                    app: channelData.publisher.app,
                    channel: channelData.publisher.channel,
                    serverType: 'nms',
                    serverId: channelData.publisher.serverId,
                    connectCreated: new Date(channelData.publisher.connectCreated)
                };

                streamObj = await Stream.findOne(streamQuery);

                if (!streamObj) {
                    streamQuery.connectUpdated = statsUpdateTime;
                    streamQuery.bytes = channelData.publisher.bytes;
                    streamQuery.ip = channelData.publisher.ip;
                    streamQuery.protocol = 'rtmp';

                    streamObj = new Stream(streamQuery);
                } else {
                    streamObj.bytes = channelData.publisher.bytes;
                    streamObj.connectUpdated = statsUpdateTime;
                }

                await streamObj.save();
            }

            for (let subscriber of channelData.subscribers) {
                let subscriberQuery = {
                    app: subscriber.app,
                    channel: subscriber.channel,
                    serverType: 'nms',
                    serverId: subscriber.serverId,
                    connectCreated: new Date(subscriber.connectCreated)
                };

                let subscriberObj = await Subscriber.findOne(subscriberQuery);

                if (!subscriberObj) {
                    subscriberQuery.connectUpdated = statsUpdateTime;
                    subscriberQuery.bytes = subscriber.bytes;
                    subscriberQuery.ip = subscriber.ip;
                    subscriberQuery.protocol = subscriber.protocol;

                    subscriberObj = new Subscriber(subscriberQuery);
                } else {
                    subscriberObj.bytes = subscriber.bytes;
                    subscriberObj.connectUpdated = statsUpdateTime;
                }

                await subscriberObj.save();
            }

            if (streamObj) {
                streamObj.viewersCount = await streamObj.countSubscribers();
                await streamObj.save();
            }
        }
    }
}

if (!nmsConfig.enabled) return;

function runUpdate() {
    updateStats()
        .then(() => {
        })
        .catch(e => {
            console.log(e.stack);
        });
}

runUpdate();

setInterval(runUpdate, 5000);
