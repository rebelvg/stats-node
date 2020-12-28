import axios from 'axios';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';
import { NMS } from '../config';
import { ApiSourceEnum } from '../models/stream';

import { BaseWorker, IGenericStreamsResponse } from './_base';

export interface INmsStreamsResponse {
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
        userId: ObjectId;
        audio: {
          audioCodec: number;
          codec: string;
          profile: string;
          samplerate: number;
          channels: number;
        };
        video: {
          videoCodec: number;
          codec: string;
          size: string;
          fps: number;
        };
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
        userId: ObjectId;
      }[];
    }[];
  }[];
}

class NmsWorker extends BaseWorker {
  apiSource = ApiSourceEnum.NMS;

  async getStats(
    host: string,
    token: string,
  ): Promise<IGenericStreamsResponse[]> {
    const {
      data: { stats: data },
    } = await axios.get<INmsStreamsResponse>(`${host}/api/streams`, {
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
          };
        }

        liveChannel.subscribers = channelStats.subscribers.map((item) => ({
          ...item,
        }));

        liveApp.channels.push(liveChannel);
      });

      stats.push(liveApp);
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
