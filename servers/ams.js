const request = require('request-promise-native');
const xml2js = require('xml2js');
const { promisify } = require('util');
const _ = require('lodash');
const { URL } = require('url');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const os = require('os');
const strtotime = require('locutus/php/datetime/strtotime');

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

const amsConfigs = require('../config.json').ams;

const parseString = promisify(xml2js.parseString);

class AmsClient {
  constructor(amsConfig) {
    this.amsConfig = amsConfig;
  }

  async getAmsStats(command, params = []) {
    const { host, amsLogin, amsPassword } = this.amsConfig;

    const apiUrl = new URL(`${host}/admin/${command}`);

    apiUrl.searchParams.set('auser', amsLogin);
    apiUrl.searchParams.set('apswd', amsPassword);

    _.forEach(params, param => {
      apiUrl.searchParams.set(param[0], param[1]);
    });

    const res = await request.get(apiUrl.href, {
      resolveWithFullResponse: true
    });

    const parsedXml = await parseString(res.body, {
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

  async getApps() {
    const getApps = await this.getAmsStats('getApps');

    return _.filter(getApps.data, (appName, key) => {
      return key !== 'total_apps';
    });
  }

  async getAppStats(appName) {
    const getAppStats = await this.getAmsStats('getAppStats', [['app', appName]]);

    if (!getAppStats.data.cores) {
      return false;
    }

    return getAppStats.data;
  }

  async getLiveStreams(appName) {
    const getLiveStreams = await this.getAmsStats('getLiveStreams', [['appInst', appName]]);

    if (!getLiveStreams.data) {
      return [];
    }

    return Object.values(getLiveStreams.data);
  }

  async getLiveStreamStats(appName, channelName) {
    const getLiveStreamStats = await this.getAmsStats('getLiveStreamStats', [
      ['appInst', appName],
      ['stream', channelName]
    ]);

    return getLiveStreamStats.data;
  }

  async getUserStats(appName, userId) {
    const getUserStats = await this.getAmsStats('getUserStats', [['appInst', appName], ['userId', userId]]);

    return getUserStats.data;
  }

  async getUsers(appName) {
    const getUsers = await this.getAmsStats('getUsers', [['appInst', appName]]);

    return _.filter(getUsers.data, (appName, key) => {
      return key !== 'name';
    });
  }

  parseClientFile(path) {
    const clientFile = fs.readFileSync(path, { encoding: 'UTF-8' });

    const clientData = clientFile.split(os.EOL);

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

  async getIPs(appName) {
    const { appsPath } = this.amsConfig;

    const clientsFolder = path.join(appsPath, appName, 'clients');

    const clientFiles = fs.readdirSync(clientsFolder);

    let fileIDs = [];

    for (const clientFileName of clientFiles) {
      fileIDs.push(this.parseClientFile(path.join(clientsFolder, clientFileName)));
    }

    fileIDs = _.sortBy(fileIDs, ['connectTime', 'amsId']);

    const users = await this.getUsers(appName);

    let apiIDs = [];

    apiIDs = _.map(users, async (userId, id) => {
      const userStats = await this.getUserStats(appName, userId);

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

    const IPs = {};

    _.forEach(apiIDs, (apiID, key) => {
      IPs[apiID.amsId] = fileIDs[key];
    });

    return IPs;
  }
}

async function updateStats(amsConfig) {
  const { name, appsPath } = amsConfig;

  const amsClient = new AmsClient(amsConfig);

  const apps = await amsClient.getApps();

  const live = {};

  const statsUpdateTime = new Date();

  for (const appName of apps) {
    const app = await amsClient.getAppStats(appName);

    if (!app) {
      continue;
    }

    const IPs = await amsClient.getIPs(appName);

    const liveStreams = await amsClient.getLiveStreams(appName);

    for (const channelName of liveStreams) {
      _.set(live, [appName, channelName], {
        publisher: null,
        subscribers: []
      });

      const liveStreamStats = await amsClient.getLiveStreamStats(appName, channelName);

      let streamObj = null;

      if (liveStreamStats.publisher) {
        const id = liveStreamStats.publisher.client;
        const userStats = await amsClient.getUserStats(appName, id);

        const streamQuery = {
          app: appName,
          channel: channelName,
          serverType: name,
          serverId: id,
          connectCreated: moment.unix(strtotime(userStats.connect_time))
        };

        streamObj = await Stream.findOne(streamQuery);

        if (!streamObj) {
          streamQuery.connectUpdated = statsUpdateTime;
          streamQuery.bytes = userStats.bytes_in;
          streamQuery.ip = amsClient.parseClientFile(path.join(appsPath, appName, 'streams', channelName)).ip;
          streamQuery.protocol = 'rtmp';

          streamObj = new Stream(streamQuery);
        } else {
          streamObj.bytes = userStats.bytes_in;
          streamObj.connectUpdated = statsUpdateTime;
        }

        await streamObj.save();

        _.set(live, [appName, channelName, 'publisher'], streamObj);
      }

      if (liveStreamStats.subscribers) {
        for (const subscriber of Object.values(liveStreamStats.subscribers)) {
          const id = subscriber.client;
          const userStats = await amsClient.getUserStats(appName, id);

          const subscriberQuery = {
            app: appName,
            channel: channelName,
            serverType: name,
            serverId: id,
            connectCreated: moment.unix(strtotime(userStats.connect_time))
          };

          let subscriberObj = await Subscriber.findOne(subscriberQuery);

          if (!subscriberObj) {
            subscriberQuery.connectUpdated = statsUpdateTime;
            subscriberQuery.bytes = userStats.bytes_out;
            subscriberQuery.ip = IPs[id].ip;
            subscriberQuery.protocol = 'rtmp';

            subscriberObj = new Subscriber(subscriberQuery);
          } else {
            subscriberObj.bytes = userStats.bytes_out;
            subscriberObj.connectUpdated = statsUpdateTime;
          }

          await subscriberObj.save();

          live[appName][channelName].subscribers.push(subscriberObj);
        }
      }

      if (streamObj) {
        await streamObj.updateInfo();
        await streamObj.save();
      }
    }
  }

  return live;
}

console.log('amsUpdate running.');

async function runUpdate() {
  await Promise.all(
    amsConfigs.map(async amsConfig => {
      try {
        const { name } = amsConfig;

        const stats = await updateStats(amsConfig);

        _.set(global.liveStats, [name], stats);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.error(error.message);

          return;
        }

        console.error(error);
      }
    })
  );
}

(async () => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runUpdate();

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
})();
