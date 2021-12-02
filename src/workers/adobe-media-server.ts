import axios from 'axios';
import * as _ from 'lodash';

import { ADOBE_MEDIA_SERVER, IWorkerConfig } from '../config';
import { ApiSourceEnum } from '../models/stream';
import { BaseWorker, IGenericStreamsResponse } from './_base';

interface IApiResponse {
  stats: {
    app: string;
    channels: {
      channel: string;
      publisher: {
        app: string;
        channel: string;
        connectId: string;
        connectCreated: Date;
        connectUpdated: Date;
        bytes: number;
        ip: string;
        protocol: string;
      };
      subscribers: {
        app: string;
        channel: string;
        connectId: string;
        connectCreated: Date;
        connectUpdated: Date;
        bytes: number;
        ip: string;
        protocol: string;
      }[];
    }[];
  }[];
}

class MediaServerWorker extends BaseWorker {
  apiSource = ApiSourceEnum.ADOBE_MEDIA_SERVER;

  async getStats(config: IWorkerConfig): Promise<IGenericStreamsResponse[]> {
    const {
      data: { stats: data },
    } = await axios.get<IApiResponse>(`${config.API_HOST}/v1/streams`, {
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
            userId: null,
          };
        }

        liveChannel.subscribers = channelStats.subscribers.map(
          (subscriber) => ({
            ...subscriber,
            userId: null,
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

  await mediaServerWorker.run(ADOBE_MEDIA_SERVER);
}
