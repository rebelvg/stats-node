import _ from 'lodash';
import { FindOptions, ObjectId, WithId } from 'mongodb';

import { IStreamModel, Stream } from '../models/stream';
import { filterSubscribers } from '../helpers/filter-subscribers';
import { subscriberService } from './subscriber';
import { ISubscriberModel } from '../models/subscriber';

class StreamService {
  public getRelatedStreams(streamRecord: IStreamModel, options?: FindOptions) {
    return Stream.find(
      {
        $and: [
          {
            _id: { $ne: streamRecord._id },
            server: streamRecord.server,
            channel: streamRecord.channel,
            connectUpdated: { $gte: streamRecord.connectCreated },
            connectCreated: { $lte: streamRecord.connectUpdated },
          },
        ],
      },
      options,
    );
  }

  public async countViewersById(subscribers: WithId<ISubscriberModel>[]) {
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
    { now: nowBytes, last: lastBytes }: { now: number; last: number },
    { now: nowTime, last: lastTime }: { now: Date; last: Date },
  ): number {
    return Math.ceil(
      ((nowBytes - lastBytes) * 8) /
        ((nowTime.valueOf() - lastTime.valueOf()) / 1000) /
        1024,
    );
  }

  public getBySubscriberIds(streamIds: ObjectId[], options?: FindOptions) {
    const query = {
      $and: [
        {
          _id: {
            $in: streamIds,
          },
        },
      ],
    };

    return Stream.find(query, options);
  }
}

export const streamService = new StreamService();
