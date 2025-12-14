import _ from 'lodash';
import { FindOptions, ObjectId } from 'mongodb';

import { IStreamModel, Stream } from '../models/stream';
import { filterSubscribers } from '../helpers/filter-subscribers';
import { subscriberService } from './subscriber';

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

  public async countViewersById(id: ObjectId) {
    const subscribers = await subscriberService.getByStreamId(id, {});

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
