import * as _ from 'lodash';

import { Subscriber } from '../models/subscriber';
import { IP } from '../models/ip';
import { hideFields } from '../helpers/hide-fields';

export function findById(req, res, next) {
  Subscriber.findById(req.params.id)
    .populate(['location'])
    .then(async subscriber => {
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
    })
    .catch(next);
}

export function find(req, res, next) {
  Subscriber.paginate(req.queryObj, {
    sort: _.isEmpty(req.sortObj) ? { connectCreated: -1 } : req.sortObj,
    page: req.query.page,
    limit: req.query.limit,
    populate: ['location']
  })
    .then(async ret => {
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

      const uniqueIPs = (await Subscriber.distinct('ip', req.queryObj)).length;

      _.forEach(ret.docs, subscriber => {
        hideFields(req.user, subscriber);
      });

      res.json({
        subscribers: ret.docs,
        options: {
          apps: await Subscriber.distinct('app', req.queryObj),
          channels: await Subscriber.distinct('channel', req.queryObj),
          countries: _.concat(await IP.distinct('api.country'), await IP.distinct('api.message')),
          protocols: await Subscriber.distinct('protocol', req.queryObj)
        },
        info: {
          totalBytes: _.get(aggregation, ['0', 'totalBytes'], 0),
          totalDuration: _.get(aggregation, ['0', 'totalDuration'], 0),
          totalIPs: uniqueIPs
        },
        total: ret.total,
        limit: ret.limit,
        page: ret.page,
        pages: ret.pages
      });
    })
    .catch(next);
}
