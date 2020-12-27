import { ObjectId } from 'mongodb';

import { Subscriber } from '../models/subscriber';

class SubscriberService {
  public getByStreamId(id: ObjectId, params: any) {
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
