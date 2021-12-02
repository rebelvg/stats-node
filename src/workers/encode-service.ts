import axios from 'axios';
import { IncomingMessage } from 'http';
import * as _ from 'lodash';

import { ENCODE_SERVICE, IWorkerConfig, KLPQ_MEDIA_SERVER } from '../config';
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

class MediaServerWorker extends BaseWorker {
  apiSource = ApiSourceEnum.ENCODE_SERVICE;

  constructor(private host: string) {
    super();
  }

  async getStats(config: IWorkerConfig): Promise<IGenericStreamsResponse[]> {
    const {
      request,
      data: { stats: data },
    } = await axios.get<IApiResponse>(
      `${config.API_HOST}/api/stats/${this.host}`,
    );

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
            app,
            channel: channelStats.channel,
            ip: (request as IncomingMessage).socket.remoteAddress,
            userId: null,
          };
        }

        liveChannel.subscribers = channelStats.subscribers.map(
          (subscriber) => ({
            ...subscriber,
            app,
            channel: channelStats.channel,
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
  await Promise.all(
    KLPQ_MEDIA_SERVER.map(async (config) => {
      const mediaServerWorker = new MediaServerWorker(config.HOSTS[0]);

      await mediaServerWorker.run(ENCODE_SERVICE);
    }),
  );
}
