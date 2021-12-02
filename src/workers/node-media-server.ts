import axios from 'axios';
import * as _ from 'lodash';

import { IWorkerConfig, NODE_MEDIA_SERVER } from '../config';
import { ApiSourceEnum } from '../models/stream';

import { BaseWorker, IGenericStreamsResponse } from './_base';

interface IApiResponse {
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
        video: {
          codec: string;
          width: number;
          height: number;
          profile: string;
          level: number;
          fps: number;
        };
      };
      subscribers: {
        app: string;
        stream: string;
        clientId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        protocol: string;
      }[];
    };
  };
}

class MediaServerWorker extends BaseWorker {
  apiSource = ApiSourceEnum.NODE_MEDIA_SERVER;

  async getStats(config: IWorkerConfig): Promise<IGenericStreamsResponse[]> {
    const { data } = await axios.get<IApiResponse>(
      `${config.API_HOST}/api/streams`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(config.API_TOKEN).toString(
            'base64',
          )}`,
        },
      },
    );

    const connectUpdated = new Date();

    const stats: IGenericStreamsResponse[] = [];

    _.forEach(data, (appStats, appName) => {
      const liveApp: IGenericStreamsResponse = {
        app: appName,
        channels: [],
      };

      _.forEach(appStats, (channelStats, channelName) => {
        const liveChannel: IGenericStreamsResponse['channels'][0] = {
          channel: channelName,
          publisher: null,
          subscribers: [],
        };

        if (channelStats.publisher) {
          const { stream, clientId, ...publisher } = channelStats.publisher;

          liveChannel.publisher = {
            ...publisher,
            channel: stream,
            connectId: clientId,
            protocol: 'rtmp',
            connectUpdated,
            userId: null,
          };
        }

        liveChannel.subscribers = channelStats.subscribers.map(
          ({ stream, clientId, ...subscriber }) => {
            return {
              ...subscriber,
              channel: stream,
              connectId: clientId,
              connectUpdated,
              userId: null,
            };
          },
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

  await mediaServerWorker.run(NODE_MEDIA_SERVER);
}
