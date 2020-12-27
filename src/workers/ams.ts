import axios from 'axios';
import * as _ from 'lodash';

import { Stream, IStreamModel } from '../models/stream';
import { Subscriber, ISubscriberModel } from '../models/subscriber';

import { AMS } from '../config';
import { IWorkerConfig, ILiveStats, liveStats } from './';
import { streamService } from '../services/stream';

export interface IStreamsResponse {
  [app: string]: {
    [channel: string]: {
      publisher: {
        app: string;
        channel: string;
        serverId: string;
        bytes: number;
        ip: string;
        protocol: string;
        connectCreated: Date;
        connectUpdated: Date;
      };
      subscribers: {
        app: string;
        channel: string;
        serverId: string;
        bytes: number;
        ip: string;
        protocol: string;
        connectCreated: Date;
        connectUpdated: Date;
      }[];
    };
  };
}

async function getNodeStats(
  host: string,
  token: string,
): Promise<IStreamsResponse> {
  const { data } = await axios.get<IStreamsResponse>(`${host}/v1/streams`, {
    headers: {
      token,
    },
  });

  return data;
}

async function updateStats(amsConfig: IWorkerConfig) {
  const { NAME, API_HOST, API_TOKEN } = amsConfig;

  const channels = await getNodeStats(API_HOST, API_TOKEN);

  const stats: ILiveStats[0] = {};

  const statsUpdateTime = new Date();

  await Promise.all(
    _.map(channels, (channelObjs, appName) => {
      return Promise.all(
        _.map(channelObjs, async (channelData, channelName) => {
          _.set(stats, [appName, channelName], {
            publisher: null,
            subscribers: [],
          });

          for (const subscriber of channelData.subscribers) {
            const subscriberQuery: Partial<ISubscriberModel> = {
              app: subscriber.app,
              channel: subscriber.channel,
              serverType: NAME,
              serverId: subscriber.serverId,
              connectCreated: new Date(subscriber.connectCreated),
            };

            let subscriberObj = await Subscriber.findOne(subscriberQuery);

            if (!subscriberObj) {
              subscriberQuery.connectUpdated = statsUpdateTime;
              subscriberQuery.bytes = subscriber.bytes;
              subscriberQuery.ip = subscriber.ip;
              subscriberQuery.protocol = subscriber.protocol;
              subscriberQuery.userId = null;

              subscriberObj = new Subscriber(subscriberQuery);
            } else {
              subscriberObj.bytes = subscriber.bytes;
              subscriberObj.connectUpdated = statsUpdateTime;
            }

            await subscriberObj.save();

            stats[appName][channelName].subscribers.push(subscriberObj);
          }

          let streamRecord: IStreamModel = null;

          if (channelData.publisher) {
            const streamQuery: Partial<IStreamModel> = {
              app: channelData.publisher.app,
              channel: channelData.publisher.channel,
              serverType: NAME,
              serverId: channelData.publisher.serverId,
              connectCreated: new Date(channelData.publisher.connectCreated),
            };

            streamRecord = await Stream.findOne(streamQuery);

            if (!streamRecord) {
              streamQuery.connectUpdated = statsUpdateTime;
              streamQuery.bytes = channelData.publisher.bytes;
              streamQuery.ip = channelData.publisher.ip;
              streamQuery.protocol = channelData.publisher.protocol;
              streamQuery.userId = null;
              streamQuery.lastBitrate = 0;

              streamRecord = new Stream(streamQuery);
            } else {
              const lastBitrate = streamService.calculateLastBitrate(
                channelData.publisher.bytes,
                streamRecord.bytes,
                statsUpdateTime,
                streamRecord.connectUpdated,
              );

              streamRecord.bytes = channelData.publisher.bytes;
              streamRecord.connectUpdated = statsUpdateTime;
              streamRecord.lastBitrate = lastBitrate;
            }

            await streamRecord.save();

            _.set(stats, [appName, channelName, 'publisher'], streamRecord);
          }
        }),
      );
    }),
  );

  return stats;
}

async function runUpdate() {
  await Promise.all(
    AMS.map(async (amsConfig) => {
      try {
        const { NAME } = amsConfig;

        const stats = await updateStats(amsConfig);

        _.set(liveStats, [NAME], stats);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('ams_update_econnrefused', error.message);

          return;
        }

        console.log('ams_update_error', error);
      }
    }),
  );
}

(async () => {
  console.log('ams_worker_running');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runUpdate();

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
})();
