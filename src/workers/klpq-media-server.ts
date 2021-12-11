import axios from 'axios';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';

import { IWorkerConfig, KLPQ_MEDIA_SERVER } from '../config';
import { ApiSourceEnum } from '../models/stream';

import { BaseWorker, IGenericStreamsResponse } from './_base';

interface IApiResponse {
  stats: {
    app: string;
    channels: {
      channel: string;
      publisher: {
        connectId: string;
        connectCreated: Date;
        connectUpdated: Date;
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
        connectUpdated: Date;
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

class MediaServerWorker extends BaseWorker {
  apiSource = ApiSourceEnum.KLPQ_MEDIA_SERVER;

  async getStats(config: IWorkerConfig): Promise<IGenericStreamsResponse[]> {
    const {
      data: { stats: data },
    } = await axios.get<IApiResponse>(`${config.API_HOST}/api/streams`, {
      headers: {
        token: config.API_TOKEN,
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
          };
        }

        liveChannel.subscribers = channelStats.subscribers.map(
          (subscriber) => ({
            ...subscriber,
            userId: subscriber.meta.userId,
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
  const mediaServerWorker = new MediaServerWorker();

  await mediaServerWorker.run(KLPQ_MEDIA_SERVER);
}
