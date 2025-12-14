import { Filter, FindOptions, ObjectId } from 'mongodb';

import { ISubscriberModel, Subscriber } from '../models/subscriber';

class SubscriberService {
  public getByStreamId(
    id: ObjectId,
    params: Filter<ISubscriberModel>,
    options?: FindOptions,
  ) {
    const query = {
      $and: [
        {
          streamIds: {
            $in: [id],
          },
        },
        params,
      ],
    };

    return Subscriber.find(query, options);
  }
}

export const subscriberService = new SubscriberService();
