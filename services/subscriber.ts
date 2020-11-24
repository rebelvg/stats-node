import { DocumentQuery } from 'mongoose';
import { IStreamModel, Stream } from '../models/stream';
import { ISubscriberModel } from '../models/subscriber';

class SubscriberService {
  public getStreams(
    subscriberRecord: ISubscriberModel,
    query: any,
  ): DocumentQuery<IStreamModel[], IStreamModel> {
    query = {
      $and: [
        {
          app: subscriberRecord.app,
          channel: subscriberRecord.channel,
          serverType: subscriberRecord.serverType,
          connectUpdated: { $gte: subscriberRecord.connectCreated },
          connectCreated: { $lte: subscriberRecord.connectUpdated },
        },
        query,
      ],
    };

    return Stream.find(query);
  }
}

export const subscriberService = new SubscriberService();
