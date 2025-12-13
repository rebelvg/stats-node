import _ from 'lodash';

import { BaseWorker, IGenericStreamsResponse } from './_base';
import { IKolpaqueEncodePush } from '../routes/push';

export class KolpaqueEncodeServiceWorker extends BaseWorker {
  public map(data: IKolpaqueEncodePush['stats'], ip: string) {
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
            ip,
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

  getStats(origin: string, secret: string): Promise<IGenericStreamsResponse[]> {
    return Promise.resolve([]);
  }
}
