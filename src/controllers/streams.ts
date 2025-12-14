import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { Stream } from '../models/stream';
import { filterSubscribers } from '../helpers/filter-subscribers';
import { streamService } from '../services/stream';
import { subscriberService } from '../services/subscriber';
import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { IChannelServerStats } from './channels';
import { userService } from '../services/user';
import { ObjectId } from 'mongodb';
import { LIVE_STATS_CACHE } from '../workers';
import { IUserModel } from '../models/user';

export async function findById(ctx: Router.RouterContext, next: Next) {
  const stream = await Stream.findOne({
    _id: new ObjectId(ctx.params.id),
  });

  if (!stream) {
    throw new Error('stream_not_found');
  }

  const subscribers = await subscriberService.getByStreamId(
    stream._id,
    ctx.queryObj,
    {
      sort: _.isEmpty(ctx.sortObj) ? { connectCreated: 1 } : ctx.sortObj,
    },
  );

  const relatedStreams = await streamService.getRelatedStreams(stream, {
    sort: {
      connectCreated: 1,
    },
  });

  const options = {
    countries: [],
    protocols: _.chain(subscribers).map('protocol').uniq().value(),
  };

  let totalPeakViewers = 0;

  _.forEach(subscribers, (subscriber) => {
    const viewersCount = filterSubscribers(
      subscribers,
      subscriber.connectCreated,
    ).length;

    if (viewersCount > totalPeakViewers) {
      totalPeakViewers = viewersCount;
    }
  });

  const info = {
    totalBytes: _.reduce(
      subscribers,
      (sum, sub) => {
        return sum + sub.bytes;
      },
      0,
    ),
    totalDuration: _.reduce(
      subscribers,
      (sum, sub) => {
        return sum + sub.duration;
      },
      0,
    ),
    totalPeakViewers,
    totalIPs: _.chain(subscribers).map('ip').uniq().value().length,
  };

  let userRecord: IUserModel | null = null;

  if (stream.userId) {
    userRecord = await userService.getById(stream.userId.toString());
  }

  const streamResponse: IChannelServerStats['apps'][0]['channels'][0]['publisher'] =
    {
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

  const subscribersResponse: IChannelServerStats['apps'][0]['channels'][0]['subscribers'][0][] =
    subscribers.map((subscriber) => {
      return {
        _id: subscriber._id.toString(),
        server: subscriber.server,
        app: subscriber.app,
        channel: subscriber.channel,
        connectId: subscriber.connectId,
        connectCreated: subscriber.connectCreated,
        connectUpdated: subscriber.connectUpdated,
        bytes: subscriber.bytes,
        ip: subscriber.ip,
        protocol: subscriber.protocol,
        userId: subscriber.userId?.toString() || null,
        streamIds: subscriber.streamIds.map((e) => e.toString()),
        duration: subscriber.duration,
        bitrate: subscriber.bitrate,
        createdAt: subscriber.createdAt,
        updatedAt: subscriber.updatedAt,
        isLive: true,
        countryCode: null,
        city: null,
      };
    });

  const userMap = await userService.getMapByIds(
    relatedStreams
      .filter((s) => s.userId)
      .map((stream) => stream.userId!.toString()),
  );

  const relatedStreamsResponse: IChannelServerStats['apps'][0]['channels'][0]['publisher'][] =
    await Promise.all(
      relatedStreams.map((stream) => {
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

  ctx.body = {
    stream: streamResponse,
    subscribers: subscribersResponse,
    options,
    info,
    relatedStreams: relatedStreamsResponse,
  };
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

  const paginatedStreams = await Stream.paginate(ctx.queryObj, {
    sort: _.isEmpty(ctx.sortObj) ? { connectCreated: -1 } : ctx.sortObj,
    skip,
    limit,
  });

  const aggregation = await Stream.aggregate([
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
        totalConnections: {
          $sum: '$totalConnectionsCount',
        },
        totalPeakViewers: {
          $sum: '$peakViewersCount',
        },
      },
    },
  ]);

  const uniqueIPs = await Stream.distinct('ip', ctx.queryObj);

  const userMap = await userService.getMapByIds(
    paginatedStreams.docs
      .filter((s) => s.userId)
      .map((stream) => stream.userId!.toString()),
  );

  const streams: IChannelServerStats['apps'][0]['channels'][0]['publisher'][] =
    await Promise.all(
      paginatedStreams.docs.map((stream) => {
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

  ctx.body = {
    streams,
    options: {
      apps: await Stream.distinct('app', ctx.queryObj),
      channels: await Stream.distinct('channel', ctx.queryObj),
      countries: [],
      protocols: await Stream.distinct('protocol', ctx.queryObj),
    },
    info: {
      totalBytes: _.get(aggregation, ['0', 'totalBytes'], 0),
      totalDuration: _.get(aggregation, ['0', 'totalDuration'], 0),
      totalConnections: _.get(aggregation, ['0', 'totalConnections'], 0),
      totalPeakViewers: _.get(aggregation, ['0', 'totalPeakViewers'], 0),
      totalIPs: uniqueIPs.length,
    },
    total: paginatedStreams.total,
    limit,
    page,
    pages: Math.ceil(paginatedStreams.total / limit),
  };
}

export async function graph(ctx: Router.RouterContext, next: Next) {
  const stream = await Stream.findOne({
    _id: new ObjectId(ctx.params.id),
  });

  if (!stream) {
    throw new Error('stream_not_found');
  }

  const subscribers = await subscriberService.getByStreamId(
    stream._id,
    ctx.queryObj,
    {
      sort: { connectCreated: 1 },
    },
  );

  let graph: {
    eventName: string;
    time: Date;
    subscribers: (ObjectId | undefined)[];
  }[] = [];

  graph.push({
    eventName: 'streamStarted',
    time: stream.connectCreated,
    subscribers: filterSubscribers(subscribers, stream.connectCreated),
  });

  _.forEach(subscribers, (subscriber) => {
    if (stream.connectCreated >= subscriber.connectCreated) {
      return;
    }

    graph.push({
      eventName: 'subscriberConnected',
      time: subscriber.connectCreated,
      subscribers: filterSubscribers(subscribers, subscriber.connectCreated),
    });
  });

  _.forEach(subscribers, (subscriber) => {
    if (subscriber.connectUpdated >= stream.connectUpdated) {
      return;
    }

    if (
      LIVE_STATS_CACHE[subscriber.server][subscriber.app][
        subscriber.channel
      ].subscribers.find((s) => s._id === subscriber._id)
    ) {
      return;
    }

    graph.push({
      eventName: 'subscriberDisconnected',
      time: subscriber.connectUpdated,
      subscribers: filterSubscribers(subscribers, subscriber.connectUpdated),
    });
  });

  if (
    LIVE_STATS_CACHE[stream.server][stream.app][stream.channel].publisher
      ?._id === stream._id
  ) {
    graph.push({
      eventName: 'streamIsLive',
      time: stream.connectUpdated,
      subscribers: filterSubscribers(subscribers, stream.connectUpdated, true),
    });
  } else {
    graph.push({
      eventName: 'streamEnded',
      time: stream.connectUpdated,
      subscribers: filterSubscribers(subscribers, stream.connectUpdated),
    });
  }

  graph = _.sortBy(graph, ['time']);

  ctx.body = { events: graph };
}
