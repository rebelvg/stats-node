const request = require('request-promise-native');
const _ = require('lodash');
const {URL} = require('url');

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

const nmsConfig = require('../config.json').nms;

const nodeHost = nmsConfig.host;
const apiKey = nmsConfig.password;

async function getNodeStats() {
    let apiUrl = new URL(`http://${nodeHost}/api/streams`);

    if (apiKey) {
        apiUrl.searchParams.set('apiKey', apiKey);
    }

    let res = await request.get(apiUrl.href, {
        resolveWithFullResponse: true,
        json: true
    });

    return res.body;
}

async function getClientsStats() {
    let apiUrl = new URL(`http://${nodeHost}/api/clients`);

    if (apiKey) {
        apiUrl.searchParams.set('apiKey', apiKey);
    }

    let res = await request.get(apiUrl.href, {
        resolveWithFullResponse: true,
        json: true
    });

    return res.body;
}

async function updateStats() {
    let data = await Promise.all([getNodeStats(), getClientsStats()]);

    let [channels, clients] = data;

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
                    channel: channelData.publisher.stream,
                    serverType: 'nms',
                    serverId: channelData.publisher.clientId,
                    connectCreated: new Date(channelData.publisher.connectCreated)
                };

                streamObj = await Stream.findOne(streamQuery);

                if (!streamObj) {
                    streamQuery.connectUpdated = statsUpdateTime;
                    streamQuery.bytes = channelData.publisher.bytes;
                    streamQuery.ip = channelData.publisher.ip;
                    streamQuery.protocol = 'rtmp';
                    streamQuery.userId = _.get(clients, [channelData.publisher.clientId, 'userId'], null);

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
                    channel: subscriber.stream,
                    serverType: 'nms',
                    serverId: subscriber.clientId,
                    connectCreated: new Date(subscriber.connectCreated)
                };

                let subscriberObj = await Subscriber.findOne(subscriberQuery);

                if (!subscriberObj) {
                    subscriberQuery.connectUpdated = statsUpdateTime;
                    subscriberQuery.bytes = subscriber.bytes;
                    subscriberQuery.ip = subscriber.ip;
                    subscriberQuery.protocol = subscriber.protocol;
                    subscriberQuery.userId = _.get(clients, [subscriber.clientId, 'userId'], null);

                    subscriberObj = new Subscriber(subscriberQuery);
                } else {
                    subscriberObj.bytes = subscriber.bytes;
                    subscriberObj.connectUpdated = statsUpdateTime;
                }

                await subscriberObj.save();

                live[appName][channelName].subscribers.push(subscriberObj);
            }

            if (streamObj) {
                await streamObj.updateInfo();
                await streamObj.save();
            }
        }
    }

    return live;
}

if (!nmsConfig.enabled) return;

console.log('nmsUpdate running.');

function runUpdate() {
    updateStats()
        .then((live) => {
            _.set(global.liveStats, ['nms'], live);
        })
        .catch(e => {
            if (e.name === 'RequestError' && e.error.code === 'ECONNREFUSED') return;

            console.error(e);
        });
}

runUpdate();

setInterval(runUpdate, 5000);
