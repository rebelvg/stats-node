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
        connectCreated: string;
        connectUpdated: string;
        bytes: number;
        ip: string;
        protocol: string;
      };
      subscribers: {
        connectId: string;
        connectCreated: string;
        connectUpdated: string;
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

    _.forEach(data, ({ app, channels }) => {
      const statsApp: IGenericStreamsResponse = {
        app,
        channels: [],
      };

      _.forEach(channels, ({ channel, publisher, subscribers }) => {
        const statsChannel: IGenericStreamsResponse['channels'][0] = {
          channel,
          publisher: null,
          subscribers: [],
        };

        if (publisher) {
          statsChannel.publisher = {
            ...publisher,
            userId: null,
            connectCreated: new Date(publisher.connectCreated),
            connectUpdated: new Date(publisher.connectUpdated),
          };
        }

        statsChannel.subscribers = subscribers.map((subscriber) => ({
          ...subscriber,
          userId: null,
          connectCreated: new Date(subscriber.connectCreated),
          connectUpdated: new Date(subscriber.connectUpdated),
        }));

        statsApp.channels.push(statsChannel);
      });

      stats.push(statsApp);
    });

    return stats;
  }
}

export async function runUpdate() {
  const mediaServerWorker = new AdobeMediaServerWorker();

  await mediaServerWorker.run(ADOBE_MEDIA_SERVER);
}
