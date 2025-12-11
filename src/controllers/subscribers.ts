import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { Subscriber } from '../models/subscriber';
import { IP } from '../models/ip';
import { hideFields } from '../helpers/hide-fields';
import { streamService } from '../services/stream';
import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { IChannelServerStats } from './channels';
import { userService } from '../services/user';

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

  const subscriberResponse: IChannelServerStats['apps'][0]['channels'][0]['subscribers'][0] =
    {
      server: subscriber.server,
      app: subscriber.app,
      channel: subscriber.channel,
      connectId: subscriber.connectId,
      connectCreated: subscriber.connectCreated,
      connectUpdated: subscriber.connectUpdated,
      bytes: subscriber.bytes,
      protocol: subscriber.protocol,
      userId: subscriber.userId?.toString() || null,
      streamIds: subscriber.streamIds.map((e) => e.toString()),
      _id: subscriber._id,
      duration: subscriber.duration,
      bitrate: subscriber.bitrate,
      createdAt: subscriber.createdAt,
      updatedAt: subscriber.updatedAt,
      isLive: subscriber.isLive,
      ip: null,
      countryCode: null,
      city: null,
      // ip: subscriber.ip,
      // countryCode: subscriber?.location?.api?.countryCode || null,
      // city: subscriber?.location?.api?.city || null,
    };

  const userMap = await userService.getMapByIds(
    streams.map((stream) => stream.userId?.toString()).filter(Boolean),
  );

  const streamsResponse: IChannelServerStats['apps'][0]['channels'][0]['publisher'][] =
    await Promise.all(
      streams.map((stream) => {
        const userRecord = userMap[stream.userId?.toString()] || null;

        return {
          server: stream.server,
          app: stream.app,
          channel: stream.channel,
          connectId: stream.connectId,
          connectCreated: stream.connectCreated,
          connectUpdated: stream.connectUpdated,
          bytes: stream.bytes,
          protocol: stream.protocol,
          lastBitrate: stream.lastBitrate,
          userId: stream.userId?.toString() || null,
          _id: stream._id,
          totalConnectionsCount: stream.totalConnectionsCount,
          peakViewersCount: stream.peakViewersCount,
          duration: stream.duration,
          bitrate: stream.bitrate,
          createdAt: stream.createdAt,
          updatedAt: stream.updatedAt,
          isLive: stream.isLive,
          userName: userRecord?.name || null,
          ip: null,
          countryCode: null,
          city: null,
          // ip: stream.ip,
          // countryCode: stream?.location?.api?.countryCode || null,
          // city: stream?.location?.api?.city || null,
        };
      }),
    );

  ctx.body = { subscriber: subscriberResponse, streams: streamsResponse };
}

export async function find(ctx: Router.IRouterContext, next: Next) {
  const isAdmin = !!ctx.state.user?.isAdmin;

  if (!isAdmin) {
    const publicChannelNames = (
      await channelService.getChannelsByType(ChannelTypeEnum.PUBLIC)
    ).map((channel) => channel.name);

    if (ctx.queryObj.$and) {
      ctx.queryObj.$and.push({
        channel: {
          $in: publicChannelNames,
        },
      });
    } else {
      ctx.queryObj.$and = [
        {
          channel: {
            $in: publicChannelNames,
          },
        },
      ];
    }
  }

  const paginatedSubscribers = await Subscriber.paginate(ctx.queryObj, {
    sort: _.isEmpty(ctx.sortObj) ? { connectCreated: -1 } : ctx.sortObj,
    page: parseInt(ctx.query.page as string) || 1,
    limit: parseInt(ctx.query.limit as string) || 20,
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
  const _uniqueCountries = await IP.distinct('api.country');
  const _uniqueApiMessages = await IP.distinct('api.message');

  _.forEach(paginatedSubscribers.docs, (subscriber) => {
    hideFields(ctx.state.user, subscriber);
  });

  const subscribers: IChannelServerStats['apps'][0]['channels'][0]['subscribers'][0][] =
    paginatedSubscribers.docs.map((subscriber) => {
      return {
        server: subscriber.server,
        app: subscriber.app,
        channel: subscriber.channel,
        connectId: subscriber.connectId,
        connectCreated: subscriber.connectCreated,
        connectUpdated: subscriber.connectUpdated,
        bytes: subscriber.bytes,
        protocol: subscriber.protocol,
        userId: subscriber.userId?.toString() || null,
        streamIds: subscriber.streamIds.map((e) => e.toString()),
        _id: subscriber._id,
        duration: subscriber.duration,
        bitrate: subscriber.bitrate,
        createdAt: subscriber.createdAt,
        updatedAt: subscriber.updatedAt,
        isLive: subscriber.isLive,
        ip: null,
        countryCode: null,
        city: null,
        // ip: subscriber.ip,
        // countryCode: subscriber?.location?.api?.countryCode || null,
        // city: subscriber?.location?.api?.city || null,
      };
    });

  ctx.body = {
    subscribers,
    options: {
      apps: await Subscriber.distinct('app', ctx.queryObj),
      channels: await Subscriber.distinct('channel', ctx.queryObj),
      countries: [],
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
