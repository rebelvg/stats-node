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

    let live = {};

    let statsUpdateTime = new Date();

    for (let appObj of Object.entries(channels)) {
        const [appName, channelObjs] = appObj;

        for (let channelObj of Object.entries(channelObjs)) {
            const [channelName, channelData] = channelObj;

            _.set(live, [appName, channelName], {
                publisher: null,
                subscribers: []
            });

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

                _.set(live, [appName, channelName, 'publisher'], streamObj);
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

                live[appName][channelName].subscribers.push(subscriberObj);
            }

            if (streamObj) {
                streamObj.viewersCount = await streamObj.countSubscribers();
                await streamObj.save();
            }
        }
    }

    return live;
}

if (!nmsConfig.enabled) return;

console.log(new Date(), 'nmsUpdate running.');

function runUpdate() {
    updateStats()
        .then((live) => {
            global.liveStats.nms = live;
        })
        .catch(e => {
            if (e.name === 'RequestError' && e.error.code === 'ECONNREFUSED') return;

            console.log(new Date(), e.message);
        });
}

runUpdate();

setInterval(runUpdate, 5000);
