import axios from 'axios';
import * as _ from 'lodash';

import { AMS } from '../config';
import { ApiSourceEnum } from '../models/stream';
import { BaseWorker, IGenericStreamsResponse } from './_base';

export interface IAmsStreamsResponse {
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

class AmsWorker extends BaseWorker {
  apiSource = ApiSourceEnum.AMS;

  async getStats(
    host: string,
    token: string,
  ): Promise<IGenericStreamsResponse[]> {
    const {
      data: { stats: data },
    } = await axios.get<IAmsStreamsResponse>(`${host}/v1/streams`, {
      headers: {
        token,
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

        liveChannel.subscribers = channelStats.subscribers.map((item) => ({
          ...item,
          userId: null,
        }));

        liveApp.channels.push(liveChannel);
      });

      stats.push(liveApp);
    });

    return stats;
  }
}

export async function runAmsUpdate() {
  console.log('ams_worker_running');

  const amsWorker = new AmsWorker();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await amsWorker.runUpdate(AMS);

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
