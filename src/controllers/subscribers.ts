import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { Subscriber } from '../models/subscriber';
import { streamService } from '../services/stream';
import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { IChannelServerStats } from './channels';
import { userService } from '../services/user';
import { ObjectId } from 'mongodb';
import { IUserModel } from '../models/user';

export async function findById(ctx: Router.RouterContext, next: Next) {
  const subscriber = await Subscriber.findOne({
    _id: new ObjectId(ctx.params.id),
  });

  if (!subscriber) {
    throw new Error('subscriber_not_found');
  }

  const streams = await streamService.getBySubscriberIds(subscriber.streamIds, {
    sort: { connectCreated: 1 },
  });

  const subscriberResponse: IChannelServerStats['apps'][0]['channels'][0]['subscribers'][0] =
    {
      _id: subscriber._id.toString(),
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
      duration: subscriber.duration,
      bitrate: subscriber.bitrate,
      createdAt: subscriber.createdAt,
      updatedAt: subscriber.updatedAt,
      isLive: true,
      ip: null,
      countryCode: null,
      city: null,
    };

  const userMap = await userService.getMapByIds(
    streams.filter((s) => s.userId).map((stream) => stream.userId!.toString()),
  );

  const streamsResponse: IChannelServerStats['apps'][0]['channels'][0]['publisher'][] =
    await Promise.all(
      streams.map((stream) => {
        let userRecord: IUserModel | null = null;

        if (stream.userId) {
          userRecord = userMap[stream.userId.toString()] || null;
        }

        return {
          _id: stream._id.toString(),
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
          totalConnectionsCount: stream.totalConnectionsCount,
          peakViewersCount: stream.peakViewersCount,
          duration: stream.duration,
          bitrate: stream.bitrate,
          createdAt: stream.createdAt,
          updatedAt: stream.updatedAt,
          isLive: true,
          userName: userRecord?.name || null,
          ip: null,
          countryCode: null,
          city: null,
        };
      }),
    );

  ctx.body = { subscriber: subscriberResponse, streams: streamsResponse };
}

export async function find(ctx: Router.RouterContext, next: Next) {
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

  const limit = parseInt(ctx.query.limit as string) || 20;
  const page = parseInt(ctx.query.page as string) || 1;
  const skip = (page - 1) * limit;

  const paginatedSubscribers = await Subscriber.paginate(ctx.queryObj, {
    sort: _.isEmpty(ctx.sortObj) ? { connectCreated: -1 } : ctx.sortObj,
    skip,
    limit,
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

  const subscribers: IChannelServerStats['apps'][0]['channels'][0]['subscribers'][0][] =
    paginatedSubscribers.docs.map((subscriber) => {
      return {
        _id: subscriber._id.toString(),
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
        duration: subscriber.duration,
        bitrate: subscriber.bitrate,
        createdAt: subscriber.createdAt,
        updatedAt: subscriber.updatedAt,
        isLive: true,
        ip: null,
        countryCode: null,
        city: null,
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
    limit,
    page,
    pages: Math.ceil(paginatedSubscribers.total / limit),
  };
}
