import _ from 'lodash';

import { BaseWorker, IGenericStreamsResponse } from './_base';
import { IKolpaqueEncodePush } from '../routes/push';
import { mapProtocol } from '../helpers/functions';

export class KolpaqueEncodeServiceWorker extends BaseWorker {
  public map(data: IKolpaqueEncodePush['stats'], ip: string) {
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
            ip,
            userId: null,
            protocol: mapProtocol(publisher.protocol),
          };
        }

        statsChannel.subscribers = subscribers.map((subscriber) => ({
          ...subscriber,
          userId: null,
          protocol: mapProtocol(subscriber.protocol),
        }));

        statsApp.channels.push(statsChannel);
      });

      stats.push(statsApp);
    });

    return stats;
  }

  getStats(origin: string, secret: string): Promise<IGenericStreamsResponse[]> {
    return Promise.resolve([]);
  }
}
