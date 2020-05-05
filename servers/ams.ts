import axios from 'axios';
import * as _ from 'lodash';

import { Stream, IStreamModel } from '../models/stream';
import { Subscriber, ISubscriberModel } from '../models/subscriber';

import { ams as amsConfigs } from '../config';
import { liveStats } from '.';

async function getNodeStats(host, token) {
  const { data } = await axios.get(`${host}/streams`, {
    headers: {
      token
    }
  });

  return data;
}

async function updateStats(amsConfigs) {
  const { name, host, token } = amsConfigs;

  const channels = await getNodeStats(host, token);

  const stats = {};

  const statsUpdateTime = new Date();

  await Promise.all(
    _.map(channels, (channelObjs, appName) => {
      return Promise.all(
        _.map(channelObjs, async (channelData, channelName) => {
          _.set(stats, [appName, channelName], {
            publisher: null,
            subscribers: []
          });

          let streamObj = null;

          if (channelData.publisher) {
            const streamQuery: Partial<IStreamModel> = {
              app: channelData.publisher.app,
              channel: channelData.publisher.stream,
              serverType: name,
              serverId: channelData.publisher.clientId,
              connectCreated: new Date(channelData.publisher.connectCreated)
            };

            streamObj = await Stream.findOne(streamQuery);

            if (!streamObj) {
              streamQuery.connectUpdated = statsUpdateTime;
              streamQuery.bytes = channelData.publisher.bytes;
              streamQuery.ip = channelData.publisher.ip;
              streamQuery.protocol = 'rtmp';
              streamQuery.userId = channelData.publisher.userId;

              streamObj = new Stream(streamQuery);
            } else {
              streamObj.bytes = channelData.publisher.bytes;
              streamObj.connectUpdated = statsUpdateTime;
            }

            await streamObj.save();

            _.set(stats, [appName, channelName, 'publisher'], streamObj);
          }

          for (const subscriber of channelData.subscribers) {
            const subscriberQuery: Partial<ISubscriberModel> = {
              app: subscriber.app,
              channel: subscriber.stream,
              serverType: name,
              serverId: subscriber.clientId,
              connectCreated: new Date(subscriber.connectCreated)
            };

            let subscriberObj = await Subscriber.findOne(subscriberQuery);

            if (!subscriberObj) {
              subscriberQuery.connectUpdated = statsUpdateTime;
              subscriberQuery.bytes = subscriber.bytes;
              subscriberQuery.ip = subscriber.ip;
              subscriberQuery.protocol = subscriber.protocol;
              subscriberQuery.userId = subscriber.userId;

              subscriberObj = new Subscriber(subscriberQuery);
            } else {
              subscriberObj.bytes = subscriber.bytes;
              subscriberObj.connectUpdated = statsUpdateTime;
            }

            await subscriberObj.save();

            stats[appName][channelName].subscribers.push(subscriberObj);
          }

          if (streamObj) {
            await streamObj.updateInfo();
            await streamObj.save();
          }
        })
      );
    })
  );

  return stats;
}

async function runUpdate() {
  await Promise.all(
    amsConfigs.map(async amsConfig => {
      try {
        const { name } = amsConfig;

        const stats = await updateStats(amsConfig);

        _.set(liveStats, [name], stats);
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
