import { Filter, ObjectId } from 'mongodb';

import { ISubscriberModel, Subscriber } from '../models/subscriber';

class SubscriberService {
  public getByStreamId(id: ObjectId, params: Filter<ISubscriberModel>) {
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

    return Subscriber.find(query);
  }
}

export const subscriberService = new SubscriberService();
