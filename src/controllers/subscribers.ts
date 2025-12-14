import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { Subscriber } from '../models/subscriber';
import { streamService } from '../services/stream';
import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { userService } from '../services/user';
import { ObjectId } from 'mongodb';
import { IUserModel } from '../models/user';
import { IChannelServerStats } from '../helpers/interfaces';

export async function findById(ctx: Router.RouterContext, next: Next) {
  const subscriberRecord = await Subscriber.findOne({
    _id: new ObjectId(ctx.params.id),
  });

  if (!subscriberRecord) {
    throw new Error('subscriber_not_found');
  }

  const streamRecords = await streamService.getBySubscriberIds(
    subscriberRecord.streamIds,
    {
      sort: { connectCreated: 1 },
    },
  );

  const isLive =
    subscriberRecord.connectUpdated > new Date(Date.now() - 30 * 1000);

  const subscriber: IChannelServerStats['apps'][0]['channels'][0]['subscribers'] =
    {
      _id: subscriberRecord._id.toString(),
      server: subscriberRecord.server,
      app: subscriberRecord.app,
      channel: subscriberRecord.channel,
      connectId: subscriberRecord.connectId,
      connectCreated: subscriberRecord.connectCreated,
      connectUpdated: subscriberRecord.connectUpdated,
      bytes: subscriberRecord.bytes,
      protocol: subscriberRecord.protocol,
      userId: subscriberRecord.userId?.toString() || null,
      streamIds: subscriberRecord.streamIds.map((e) => e.toString()),
      duration: subscriberRecord.duration,
      bitrate: subscriberRecord.bitrate,
      createdAt: subscriberRecord.createdAt,
      updatedAt: subscriberRecord.updatedAt,
      isLive,
    };

  const userMap = await userService.getMapByIds(
    streamRecords
      .filter((s) => s.userId)
      .map((stream) => stream.userId!.toString()),
  );

  const streams = await Promise.all(
    streamRecords.map(
      (stream): IChannelServerStats['apps'][0]['channels'][0]['publisher'] => {
        let userRecord: IUserModel | null = null;

        if (stream.userId) {
          userRecord = userMap[stream.userId.toString()] || null;
        }

        const isLive = stream.connectUpdated > new Date(Date.now() - 30 * 1000);

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
          isLive,
          userName: userRecord?.name || null,
        };
      },
    ),
  );

  ctx.body = { subscriber, streams };
}

export async function find(ctx: Router.RouterContext, next: Next) {
  const isAdmin = !!ctx.state.user?.isAdmin;

  if (!isAdmin) {
    const channels = await channelService.getChannelsByType(
      ChannelTypeEnum.PUBLIC,
    );

    const channelNames = channels.map((c) => c.name);

    if (ctx.ctx.state.query.$and) {
      ctx.ctx.state.query.$and.push({
        channel: {
          $in: channelNames,
        },
      });
    } else {
      ctx.ctx.state.query.$and = [
        {
          channel: {
            $in: channelNames,
          },
        },
      ];
    }
  }

  const limit = parseInt(ctx.query.limit as string) || 20;
  const page = parseInt(ctx.query.page as string) || 1;
  const skip = (page - 1) * limit;

  const paginatedSubscribers = await Subscriber.paginate(ctx.ctx.state.query, {
    sort: _.isEmpty(ctx.state.sort) ? { connectCreated: -1 } : ctx.state.sort,
    skip,
    limit,
  });

  const aggregation = await Subscriber.aggregate([
    { $match: ctx.ctx.state.query },
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

  const uniqueIPs = await Subscriber.distinct('ip', ctx.ctx.state.query);

  const subscribers = paginatedSubscribers.docs.map(
    (
      subscriber,
    ): IChannelServerStats['apps'][0]['channels'][0]['subscribers'] => {
      const isLive =
        subscriber.connectUpdated > new Date(Date.now() - 30 * 1000);

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
        isLive,
      };
    },
  );

  ctx.body = {
    subscribers,
    options: {
      apps: await Subscriber.distinct('app', ctx.ctx.state.query),
      channels: await Subscriber.distinct('channel', ctx.ctx.state.query),
      countries: [],
      protocols: await Subscriber.distinct('protocol', ctx.ctx.state.query),
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
