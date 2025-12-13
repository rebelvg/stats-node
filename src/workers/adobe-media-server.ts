import axios from 'axios';
import _ from 'lodash';

import { ADOBE_MEDIA_SERVER } from '../config';
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
      };
      subscribers: {
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

class AdobeMediaServerWorker extends BaseWorker {
  async getStats(
    origin: string,
    secret: string,
  ): Promise<IGenericStreamsResponse[]> {
    const {
      data: { stats: data },
    } = await axios.get<IApiResponse>(`${origin}/v1/streams`, {
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
  const mediaServerWorker = new AdobeMediaServerWorker();

  await mediaServerWorker.run(ADOBE_MEDIA_SERVER);
}
