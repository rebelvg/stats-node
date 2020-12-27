import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { Subscriber } from '../models/subscriber';
import { IP } from '../models/ip';
import { hideFields } from '../helpers/hide-fields';
import { streamService } from '../services/stream';

export async function findById(ctx: Router.IRouterContext, next: Next) {
  const subscriber = await Subscriber.findById(ctx.params.id).populate([
    'location',
  ]);

  if (!subscriber) {
    throw new Error('subscriber_not_found');
  }

  const streams = await streamService
    .getBySubscriberIds(subscriber.streamIds, {})
    .sort({ connectCreated: 1 })
    .populate(['location']);

  hideFields(ctx.state.user, subscriber);

  _.forEach(streams, (stream) => {
    hideFields(ctx.state.user, stream);
  });

  ctx.body = { subscriber: subscriber, streams: streams };
}

export async function find(ctx: Router.IRouterContext, next: Next) {
  const paginatedSubscribers = await Subscriber.paginate(ctx.queryObj, {
    sort: _.isEmpty(ctx.sortObj) ? { connectCreated: -1 } : ctx.sortObj,
    page: parseInt(ctx.query.page as string),
    limit: parseInt(ctx.query.limit as string),
    populate: ['location'],
  });

  const aggregation = await Subscriber.aggregate([
    { $match: ctx.queryObj },
    {
      $group: {
        _id: null,
        totalBytes: {
          $sum: '$bytes',
        },
        totalDuration: {
          $sum: '$duration',
        },
      },
    },
  ]);

  const uniqueIPs = await Subscriber.distinct('ip', ctx.queryObj);
  const uniqueCountries = await IP.distinct('api.country');
  const uniqueApiMessages = await IP.distinct('api.message');

  _.forEach(paginatedSubscribers.docs, (subscriber) => {
    hideFields(ctx.state.user, subscriber);
  });

  ctx.body = {
    subscribers: paginatedSubscribers.docs,
    options: {
      apps: await Subscriber.distinct('app', ctx.queryObj),
      channels: await Subscriber.distinct('channel', ctx.queryObj),
      countries: _.concat(uniqueCountries, uniqueApiMessages),
      protocols: await Subscriber.distinct('protocol', ctx.queryObj),
    },
    info: {
      totalBytes: _.get(aggregation, ['0', 'totalBytes'], 0),
      totalDuration: _.get(aggregation, ['0', 'totalDuration'], 0),
      totalIPs: uniqueIPs.length,
    },
    total: paginatedSubscribers.total,
    limit: paginatedSubscribers.limit,
    page: paginatedSubscribers.page,
    pages: paginatedSubscribers.pages,
  };
}
