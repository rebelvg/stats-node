import * as _ from 'lodash';

import { Subscriber } from '../models/subscriber';
import { IP } from '../models/ip';
import { hideFields } from '../helpers/hide-fields';

export async function findById(req, res, next) {
  const subscriber = await Subscriber.findById(req.params.id).populate(['location']);

  if (!subscriber) {
    throw new Error('Subscriber not found.');
  }

  const streams = await subscriber
    .getStreams()
    .sort({ connectCreated: 1 })
    .populate(['location']);

  hideFields(req.user, subscriber);

  _.forEach(streams, stream => {
    hideFields(req.user, stream);
  });

  res.json({ subscriber: subscriber, streams: streams });
}

export async function find(req, res, next) {
  const paginatedSubscribers = await Subscriber.paginate(req.queryObj, {
    sort: _.isEmpty(req.sortObj) ? { connectCreated: -1 } : req.sortObj,
    page: req.query.page,
    limit: req.query.limit,
    populate: ['location']
  });

  const aggregation = await Subscriber.aggregate([
    { $match: req.queryObj },
    {
      $group: {
        _id: null,
        totalBytes: {
          $sum: '$bytes'
        },
        totalDuration: {
          $sum: '$duration'
        }
      }
    }
  ]);

  const uniqueIPs = await Subscriber.distinct('ip', req.queryObj);
  const uniqueCountries = await IP.distinct('api.country');
  const uniqueApiMessages = await IP.distinct('api.message');

  _.forEach(paginatedSubscribers.docs, subscriber => {
    hideFields(req.user, subscriber);
  });

  res.json({
    subscribers: paginatedSubscribers.docs,
    options: {
      apps: await Subscriber.distinct('app', req.queryObj),
      channels: await Subscriber.distinct('channel', req.queryObj),
      countries: _.concat(uniqueCountries, uniqueApiMessages),
      protocols: await Subscriber.distinct('protocol', req.queryObj)
    },
    info: {
      totalBytes: _.get(aggregation, ['0', 'totalBytes'], 0),
      totalDuration: _.get(aggregation, ['0', 'totalDuration'], 0),
      totalIPs: uniqueIPs.length
    },
    total: paginatedSubscribers.total,
    limit: paginatedSubscribers.limit,
    page: paginatedSubscribers.page,
    pages: paginatedSubscribers.pages
  });
}
