import axios from 'axios';
import _ from 'lodash';
import { ObjectId } from 'mongodb';

import { KOLPAQUE_RTMP } from '../config';

import { BaseWorker, IGenericStreamsResponse } from './_base';

interface IApiResponse {
  stats: {
    app: string;
    channels: {
      channel: string;
      publisher: {
        connectId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        protocol: string;
        video: {
          codecId: number;
          codecName: string;
          size: string;
          fps: number;
        };
        audio: {
          codecId: number;
          codecName: string;
          profile: string;
          sampleRate: number;
          channels: number;
        };
        meta: {
          userId: ObjectId;
        };
      };
      subscribers: {
        connectId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        protocol: string;
        meta: {
          userId: ObjectId;
        };
      }[];
    }[];
  }[];
}

class KolpaqueRtmpServiceWorker extends BaseWorker {
  async getStats(
    origin: string,
    secret: string,
  ): Promise<IGenericStreamsResponse[]> {
    const timestamp = new Date();

    const {
      data: { stats: data },
    } = await axios.get<IApiResponse>(`${origin}/api/streams`, {
      headers: {
        token: secret,
      },
    });

    const stats: IGenericStreamsResponse[] = [];

    _.forEach(data, (appStats) => {
      const { app } = appStats;

      const liveApp: IGenericStreamsResponse = {
        app,
        channels: [],
      };

      _.forEach(appStats.channels, (channelStats) => {
        const { channel } = channelStats;

        const liveChannel: IGenericStreamsResponse['channels'][0] = {
          channel,
          publisher: null,
          subscribers: [],
        };

        if (channelStats.publisher) {
          liveChannel.publisher = {
            ...channelStats.publisher,
            userId: channelStats.publisher.meta.userId,
            connectUpdated: timestamp,
          };
        }

        liveChannel.subscribers = channelStats.subscribers.map(
          (subscriber) => ({
            ...subscriber,
            userId: subscriber.meta.userId,
            connectUpdated: timestamp,
          }),
        );

        liveApp.channels.push(liveChannel);
      });

      stats.push(liveApp);
    });

    return stats;
  }
}

export async function runUpdate() {
  const mediaServerWorker = new KolpaqueRtmpServiceWorker();

  await mediaServerWorker.run(KOLPAQUE_RTMP);
}
