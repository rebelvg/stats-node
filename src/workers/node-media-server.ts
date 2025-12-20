import axios from 'axios';
import _ from 'lodash';

import { NODE_MEDIA_SERVER } from '../config';

import { BaseWorker, IGenericStreamsResponse } from './_base';
import { EnumProtocols } from '../helpers/interfaces';
import { mapProtocol } from '../helpers/functions';

interface IApiResponse {
  [app: string]: {
    [channel: string]: {
      publisher: {
        clientId: string;
        connectCreated: string;
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
        clientId: string;
        connectCreated: string;
        bytes: number;
        ip: string;
        protocol: string;
      }[];
    };
  };
}

class NodeMediaServerWorker extends BaseWorker {
  async getStats(
    origin: string,
    secret: string,
  ): Promise<IGenericStreamsResponse[]> {
    const { data } = await axios.get<IApiResponse>(`${origin}/api/streams`, {
      headers: {
        Authorization: `Basic ${Buffer.from(secret).toString('base64')}`,
      },
    });

    const connectUpdated = new Date();

    const stats: IGenericStreamsResponse[] = [];

    _.forEach(data, (app, appName) => {
      const statsApp: IGenericStreamsResponse = {
        app: appName,
        channels: [],
      };

      _.forEach(app, ({ publisher, subscribers }, channelName) => {
        const statsChannel: IGenericStreamsResponse['channels'][0] = {
          channel: channelName,
          publisher: null,
          subscribers: [],
        };

        if (publisher) {
          const { clientId, ...rest } = publisher;

          statsChannel.publisher = {
            ...rest,
            connectId: clientId,
            protocol: EnumProtocols.RTMP,
            connectCreated: new Date(publisher.connectCreated),
            connectUpdated,
            userId: null,
          };
        }

        statsChannel.subscribers = subscribers.map(
          ({ clientId, ...subscriber }) => {
            return {
              ...subscriber,
              channel: channelName,
              connectId: clientId,
              connectCreated: new Date(subscriber.connectCreated),
              connectUpdated,
              userId: null,
              protocol: mapProtocol(subscriber.protocol),
            };
          },
        );

        statsApp.channels.push(statsChannel);
      });

      stats.push(statsApp);
    });

    return stats;
  }
}

export async function runUpdate() {
  const mediaServerWorker = new NodeMediaServerWorker();

  await mediaServerWorker.run(NODE_MEDIA_SERVER);
}
