import * as _ from 'lodash';
import { DocumentQuery } from 'mongoose';

import { IStreamModel, Stream } from '../models/stream';
import { ISubscriberModel, Subscriber } from '../models/subscriber';
import { filterSubscribers } from '../helpers/filter-subscribers';

class StreamService {
  public getSubscribers(
    streamRecord: IStreamModel,
    query: any,
  ): DocumentQuery<ISubscriberModel[], ISubscriberModel> {
    query = {
      $and: [
        {
          app: streamRecord.app,
          channel: streamRecord.channel,
          serverType: streamRecord.serverType,
          connectUpdated: { $gte: streamRecord.connectCreated },
          connectCreated: { $lte: streamRecord.connectUpdated },
        },
        query,
      ],
    };

    return Subscriber.find(query);
  }

  public getRelatedStreams(
    streamRecord: IStreamModel,
    query: any,
  ): DocumentQuery<IStreamModel[], IStreamModel> {
    query = {
      $and: [
        {
          _id: { $ne: streamRecord._id },
          channel: streamRecord.channel,
          serverType: streamRecord.serverType,
          connectUpdated: { $gte: streamRecord.connectCreated },
          connectCreated: { $lte: streamRecord.connectUpdated },
        },
        query,
      ],
    };

    return Stream.find(query);
  }

  public async countViewers(streamRecord: IStreamModel) {
    const subscribers = await this.getSubscribers(streamRecord, {});

    const totalConnectionsCount = subscribers.length;
    let peakViewersCount = 0;

    _.forEach(subscribers, (subscriber) => {
      const viewersCount = filterSubscribers(
        subscribers,
        subscriber.connectCreated,
      ).length;

      if (viewersCount > peakViewersCount) {
        peakViewersCount = viewersCount;
      }
    });

    return {
      totalConnectionsCount,
      peakViewersCount,
    };
  }

  public calculateLastBitrate(
    bytes: number,
    bytesPrev: number,
    updateTime: Date,
    updateTimePrev: Date,
  ): number {
    return Math.ceil(
      ((bytes - bytesPrev) * 8) /
        ((updateTime.valueOf() - updateTimePrev.valueOf()) / 1000) /
        1024,
    );
  }
}

export const streamService = new StreamService();
