const request = require('request-promise-native');
const xml2js = require('xml2js');
const {promisify} = require('util');
const _ = require('lodash');
const {URL} = require('url');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const os = require('os');
const strtotime = require('locutus/php/datetime/strtotime');

const Stream = require('./models/stream');
const Subscriber = require('./models/subscriber');

const amsConfig = require('./config.json').ams;

let parseString = promisify(xml2js.parseString);

const amsAppsPath = amsConfig.appsPath;

const amsHost = amsConfig.host;
const amsLogin = amsConfig.user;
const amsPassword = amsConfig.password;

async function getAmsStats(command, params = []) {
    let apiUrl = new URL(`http://${amsHost}/admin/${command}`);

    apiUrl.searchParams.set('auser', amsLogin);
    apiUrl.searchParams.set('apswd', amsPassword);

    _.forEach(params, (param) => {
        apiUrl.searchParams.set(param[0], param[1]);
    });

    let res = await request.get(apiUrl.href, {
        resolveWithFullResponse: true
    });

    let parsedXml = await parseString(res.body, {
        trim: true,
        explicitArray: false,
        explicitRoot: false,
        emptyTag: null
    });

    if (parsedXml.code !== 'NetConnection.Call.Success') {
        throw new Error(parsedXml.description);
    }

    return parsedXml;
}

async function getApps() {
    let getApps = await getAmsStats('getApps');

    return _.filter(getApps.data, (appName, key) => {
        return key !== 'total_apps';
    });
}

async function getAppStats(appName) {
    let getAppStats = await getAmsStats('getAppStats', [['app', appName]]);

    if (!getAppStats.data.cores) {
        return false;
    }

    return getAppStats.data;
}

async function getLiveStreams(appName) {
    let getLiveStreams = await getAmsStats('getLiveStreams', [['appInst', appName]]);

    if (!getLiveStreams.data) {
        return [];
    }

    return Object.values(getLiveStreams.data);
}

async function getLiveStreamStats(appName, streamName) {
    let getLiveStreamStats = await getAmsStats('getLiveStreamStats', [['appInst', appName], ['stream', streamName]]);

    return getLiveStreamStats.data;
}

async function getUserStats(appName, userId) {
    let getUserStats = await getAmsStats('getUserStats', [['appInst', appName], ['userId', userId]]);

    return getUserStats.data;
}

async function getUsers(appName) {
    let getUsers = await getAmsStats('getUsers', [['appInst', appName]]);

    return _.filter(getUsers.data, (appName, key) => {
        return key !== 'name';
    });
}

function parseClientFile(clientFile) {
    let clientData = clientFile.split(os.EOL);

    return {
        amsId: clientData[0],
        connectTime: clientData[1],
        ip: clientData[2],
        agent: clientData[3],
        page: clientData[4],
        referrer: clientData[5],
        password: clientData[6]
    };
}

async function getIPs(appName) {
    let clientsFolder = path.join(amsAppsPath, appName, 'clients');

    let clientFiles = fs.readdirSync(clientsFolder);

    let fileIDs = [];

    for (let clientFileName of clientFiles) {
        let clientFile = fs.readFileSync(path.join(clientsFolder, clientFileName), {encoding: 'UTF-8'});

        fileIDs.push(parseClientFile(clientFile));
    }

    fileIDs = _.sortBy(fileIDs, ['connectTime', 'amsId']);

    let users = await getUsers(appName);

    let apiIDs = [];

    apiIDs = _.map(users, async (userId, id) => {
        let userStats = await getUserStats(appName, userId);

        return {
            amsId: userId,
            connectTime: moment.unix(strtotime(userStats.connect_time)),
            id: id
        };
    });

    apiIDs = await Promise.all(apiIDs);

    apiIDs = _.sortBy(apiIDs, ['connectTime', 'id']);

    if (fileIDs.length !== apiIDs.length) {
        throw new Error(`Lengths don't match.`);
    }

    let IPs = {};

    _.forEach(apiIDs, (apiID, key) => {
        IPs[apiID.amsId] = fileIDs[key];
    });

    return IPs;
}

async function updateStats() {
    let apps = await getApps();

    let live = {};

    let statsUpdateTime = new Date();

    for (let appName of apps) {
        let app = await getAppStats(appName);

        if (!app) {
            continue;
        }

        let IPs = await getIPs(appName);

        live[appName] = {};

        let liveStreams = await getLiveStreams(appName);

        for (let streamName of liveStreams) {
            live[appName][streamName] = {
                publisher: null,
                subscribers: []
            };

            let liveStreamStats = await getLiveStreamStats(appName, streamName);

            let streamObj = null;

            if (liveStreamStats.publisher) {
                let id = liveStreamStats.publisher.client;
                let userStats = await getUserStats(appName, id);

                let streamQuery = {
                    app: appName,
                    channel: streamName,
                    serverId: id,
                    connectCreated: moment.unix(strtotime(userStats.connect_time))
                };

                streamObj = await Stream.findOne(streamQuery);

                if (!streamObj) {
                    streamQuery.connectUpdated = statsUpdateTime;
                    streamQuery.bytes = userStats.bytes_in;
                    streamQuery.ip = IPs[id].ip;

                    streamObj = new Stream(streamQuery);
                } else {
                    streamObj.bytes = userStats.bytes_in;
                    streamObj.connectUpdated = statsUpdateTime;
                }

                await streamObj.save();

                live[appName][streamName].publisher = streamObj;
            }

            if (liveStreamStats.subscribers) {
                for (let subscriber of Object.values(liveStreamStats.subscribers)) {
                    let id = subscriber.client;
                    let userStats = await getUserStats(appName, id);

                    let subscriberQuery = {
                        app: appName,
                        channel: streamName,
                        serverId: id,
                        connectCreated: moment.unix(strtotime(userStats.connect_time))
                    };

                    let subscriberObj = await Subscriber.findOne(subscriberQuery);

                    if (!subscriberObj) {
                        subscriberQuery.connectUpdated = statsUpdateTime;
                        subscriberQuery.bytes = userStats.bytes_out;
                        subscriberQuery.ip = IPs[id].ip;

                        subscriberObj = new Subscriber(subscriberQuery);
                    } else {
                        subscriberObj.bytes = userStats.bytes_out;
                        subscriberObj.connectUpdated = statsUpdateTime;
                    }

                    await subscriberObj.save();

                    live[appName][streamName].subscribers.push(subscriberObj);
                }
            }

            if (streamObj) {
                streamObj.viewersCount = await streamObj.countSubscribers();
                await streamObj.save();
            }
        }
    }

    return live;
}

let exportObj = {
    live: {}
};

global.amsUpdate = exportObj;

function runUpdate() {
    updateStats()
        .then((live) => {
            exportObj.live = live;
        })
        .catch(e => {
            console.log(e.stack);
        });
}

runUpdate();

setInterval(runUpdate, 5000);
