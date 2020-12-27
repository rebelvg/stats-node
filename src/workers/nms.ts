import axios from 'axios';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';
import { NMS } from '../config';

import { BaseWorker, IGenericStreamsResponse } from './_base';

interface INmsStreamsResponse {
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

class NmsWorker extends BaseWorker {
  async getStats(
    host: string,
    token: string,
  ): Promise<IGenericStreamsResponse> {
    const { data } = await axios.get<INmsStreamsResponse>(
      `${host}/api/streams`,
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
            channel: channelStats.publisher.stream,
            connectId: channelStats.publisher.clientId,
          };
        }

        stats[appName][channelName] = {
          publisher,
          subscribers: channelStats.subscribers.map((item) => ({
            ...item,
            channel: item.stream,
            connectId: item.clientId,
          })),
        };
      });
    });

    return stats;
  }
}

export async function runNmsUpdate() {
  console.log('nms_worker_running');

  const nmsWorker = new NmsWorker();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await nmsWorker.runUpdate(NMS);

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
