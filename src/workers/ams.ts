import axios from 'axios';
import * as _ from 'lodash';

import { AMS } from '../config';
import { ApiSourceEnum } from '../models/stream';
import { BaseWorker, IGenericStreamsResponse } from './_base';

export interface IAmsStreamsResponse {
  [app: string]: {
    [channel: string]: {
      publisher: {
        app: string;
        channel: string;
        connectId: string;
        bytes: number;
        ip: string;
        protocol: string;
        connectCreated: Date;
        connectUpdated: Date;
      };
      subscribers: {
        app: string;
        channel: string;
        connectId: string;
        bytes: number;
        ip: string;
        protocol: string;
        connectCreated: Date;
        connectUpdated: Date;
      }[];
    };
  };
}

class AmsWorker extends BaseWorker {
  apiSource = ApiSourceEnum.AMS;

  async getStats(
    host: string,
    token: string,
  ): Promise<IGenericStreamsResponse> {
    const { data } = await axios.get<IAmsStreamsResponse>(
      `${host}/v1/streams`,
      {
        headers: {
          token,
        },
      },
    );

    const stats: IGenericStreamsResponse = {};

    _.forEach(data, (appStats, appName) => {
      stats[appName] = {};

      _.forEach(appStats, (channelStats, channelName) => {
        let publisher: IGenericStreamsResponse['app']['channel']['publisher'] = null;

        if (channelStats.publisher) {
          publisher = {
            ...channelStats.publisher,
            userId: null,
          };
        }

        stats[appName][channelName] = {
          publisher,
          subscribers: channelStats.subscribers.map((item) => ({
            ...item,
            userId: null,
          })),
        };
      });
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
