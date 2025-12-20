import axios from 'axios';
import _ from 'lodash';

import { KOLPAQUE_RTMP } from '../config';

import { BaseWorker, IGenericStreamsResponse } from './_base';
import { mapProtocol } from '../helpers/functions';

interface IApiResponse {
  stats: {
    app: string;
    channels: {
      channel: string;
      publisher: {
        connectId: string;
        connectCreated: string;
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
          userId: string;
        };
      };
      subscribers: {
        connectId: string;
        connectCreated: string;
        bytes: number;
        ip: string;
        protocol: string;
        meta: {
          userId: string;
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

      const statsApp: IGenericStreamsResponse = {
        app,
        channels: [],
      };

      _.forEach(appStats.channels, ({ channel, publisher, subscribers }) => {
        const statsChannel: IGenericStreamsResponse['channels'][0] = {
          channel,
          publisher: null,
          subscribers: [],
        };

        if (publisher) {
          statsChannel.publisher = {
            ...publisher,
            userId: publisher.meta.userId,
            connectCreated: new Date(publisher.connectCreated),
            connectUpdated: timestamp,
            protocol: mapProtocol(publisher.protocol),
          };
        }

        statsChannel.subscribers = subscribers.map((subscriber) => ({
          ...subscriber,
          userId: subscriber.meta.userId,
          connectCreated: new Date(subscriber.connectCreated),
          connectUpdated: timestamp,
          protocol: mapProtocol(subscriber.protocol),
        }));

        statsApp.channels.push(statsChannel);
      });

      stats.push(statsApp);
    });

    return stats;
  }
}

export async function runUpdate() {
  const mediaServerWorker = new KolpaqueRtmpServiceWorker();

  await mediaServerWorker.run(KOLPAQUE_RTMP);
}
