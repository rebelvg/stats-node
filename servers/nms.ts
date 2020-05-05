import axios from 'axios';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';

import { Stream, IStreamModel } from '../models/stream';
import { Subscriber, ISubscriberModel } from '../models/subscriber';

import { nms as nmsConfigs } from '../config';
import { liveStats } from '.';

interface IStreamsResponse {
  [app: string]: {
    [channel: string]: {
      publisher: {
        app: string;
        stream: string;
        clientId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        audio: { codec: string; profile: string; samplerate: number; channels: number };
        video: { codec: string; size: string; fps: number };
        userId: ObjectId;
      };
      subscribers: {
        app: string;
        stream: string;
        clientId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        protocol: string;
        userId: ObjectId;
      }[];
    };
  };
}

async function getNodeStats(host, token): Promise<IStreamsResponse> {
  const { data } = await axios.get<IStreamsResponse>(`${host}/api/streams`, {
    headers: {
      token
    }
  });

  return data;
}

async function updateStats(nmsConfig) {
  const { name, host, token } = nmsConfig;

  const channels = await getNodeStats(host, token);

  const stats = {};

  const statsUpdateTime = new Date();

  await Promise.all(
    _.map(channels, (channelObjs, appName) => {
      return _.map(channelObjs, async (channelData, channelName) => {
        _.set(stats, [appName, channelName], {
          publisher: null,
          subscribers: []
        });

        let streamObj: IStreamModel = null;

        if (channelData.publisher) {
          const streamQuery: Partial<IStreamModel> = {
            app: channelData.publisher.app,
            channel: channelData.publisher.stream,
            serverType: name,
            serverId: channelData.publisher.clientId,
            connectCreated: channelData.publisher.connectCreated
          };

          streamObj = await Stream.findOne(streamQuery);

          if (!streamObj) {
            streamQuery.connectUpdated = statsUpdateTime;
            streamQuery.bytes = channelData.publisher.bytes;
            streamQuery.ip = channelData.publisher.ip;
            streamQuery.protocol = 'rtmp';
            streamQuery.userId = channelData.publisher.userId;
            streamQuery.lastBitrate = 0;

            streamObj = new Stream(streamQuery);
          } else {
            const lastBitrate = Math.ceil(
              ((channelData.publisher.bytes - streamObj.bytes) * 8) /
                ((statsUpdateTime.valueOf() - streamObj.connectUpdated.valueOf()) / 1000) /
                1024
            );

            streamObj.bytes = channelData.publisher.bytes;
            streamObj.connectUpdated = statsUpdateTime;
            streamObj.lastBitrate = lastBitrate;
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
            connectCreated: subscriber.connectCreated
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
      });
    })
  );

  return stats;
}

async function runUpdate() {
  await Promise.all(
    nmsConfigs.map(async nmsConfig => {
      try {
        const { name } = nmsConfig;

        const stats = await updateStats(nmsConfig);

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
