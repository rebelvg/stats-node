import _ from 'lodash';
import { ISubscriberModel } from '../models/subscriber';

export function filterSubscribers(
  subscribers: ISubscriberModel[],
  time: Date,
  include = false,
) {
  const compareFnc = include ? _.gte : _.gt;

  return _.filter(subscribers, (subscriber) => {
    return (
      compareFnc(subscriber.connectUpdated, time) &&
      _.gte(time, subscriber.connectCreated)
    );
  }).map((subscriber) => {
    return subscriber._id;
  });
}
