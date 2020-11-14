import axios from 'axios';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';

import { Stream, IStreamModel } from '../models/stream';
import { Subscriber, ISubscriberModel } from '../models/subscriber';

import { nms as nmsConfigs } from '../config';
import { ILiveStats, INmsWorkerConfig, liveStats } from './';
import { streamService } from '../services/stream';

export interface IStreamsResponse {
  [app: string]: {
    [channel: string]: {
      publisher: {
        app: string;
        stream: string;
        clientId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        audio: {
          codec: string;
          profile: string;
          samplerate: number;
          channels: number;
        };
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

async function getNodeStats(
  host: string,
  token: string,
): Promise<IStreamsResponse> {
  const { data } = await axios.get<IStreamsResponse>(`${host}/api/streams`, {
    headers: {
      token,
    },
  });

  return data;
}

async function updateStats(nmsConfig: INmsWorkerConfig) {
  const { name, host, token } = nmsConfig;

  const channels = await getNodeStats(host, token);

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
              channel: subscriber.stream,
              serverType: name,
              serverId: subscriber.clientId,
              connectCreated: subscriber.connectCreated,
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

          let streamRecord: IStreamModel = null;

          if (channelData.publisher) {
            const streamQuery: Partial<IStreamModel> = {
              app: channelData.publisher.app,
              channel: channelData.publisher.stream,
              serverType: name,
              serverId: channelData.publisher.clientId,
              connectCreated: channelData.publisher.connectCreated,
            };

            streamRecord = await Stream.findOne(streamQuery);

            if (!streamRecord) {
              streamQuery.connectUpdated = statsUpdateTime;
              streamQuery.bytes = channelData.publisher.bytes;
              streamQuery.ip = channelData.publisher.ip;
              streamQuery.protocol = 'rtmp';
              streamQuery.userId = channelData.publisher.userId;
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
    nmsConfigs.map(async (nmsConfig) => {
      try {
        const { name } = nmsConfig;

        const stats = await updateStats(nmsConfig);

        _.set(liveStats, [name], stats);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log('nms_update_econnrefused', error.message);

          return;
        }

        console.log('nms_update_error', error);
      }
    }),
  );
}

(async () => {
  console.log('nms_worker_running');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await runUpdate();

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
})();
