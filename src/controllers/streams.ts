import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { Stream } from '../models/stream';
import { IP } from '../models/ip';
import { hideFields } from '../helpers/hide-fields';
import { filterSubscribers } from '../helpers/filter-subscribers';
import { streamService } from '../services/stream';
import { subscriberService } from '../services/subscriber';
import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { IChannelServerStats } from './channels';
import { userService } from '../services/user';

export async function findById(ctx: Router.IRouterContext, next: Next) {
  const stream = await Stream.findById(ctx.params.id).populate(['location']);

  if (!stream) {
    throw new Error('stream_not_found');
  }

  const subscribers = await subscriberService
    .getByStreamId(stream._id, ctx.queryObj)
    .sort(_.isEmpty(ctx.sortObj) ? { connectCreated: 1 } : ctx.sortObj)
    .populate(['location']);

  const relatedStreams = await streamService
    .getRelatedStreams(stream, {})
    .sort({ connectCreated: 1 })
    .populate(['location']);

  const options = {
    countries: _.concat(
      _.chain(subscribers).map('location.api.country').compact().uniq().value(),
      _.chain(subscribers).map('location.api.message').compact().uniq().value(),
    ),
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

  hideFields(ctx.state.user, stream);

  _.forEach(subscribers, (subscriber) => {
    hideFields(ctx.state.user, subscriber);
  });

  _.forEach(relatedStreams, (stream) => {
    hideFields(ctx.state.user, stream);
  });

  const userRecord = await userService.getById(stream.userId?.toString());

  const streamResponse: IChannelServerStats['apps'][0]['channels'][0]['publisher'] =
    {
      server: stream.server,
      app: stream.app,
      channel: stream.channel,
      connectId: stream.connectId,
      connectCreated: stream.connectCreated,
      connectUpdated: stream.connectUpdated,
      bytes: stream.bytes,
      ip: stream.ip,
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
      countryCode: stream?.location?.api?.countryCode || null,
      city: stream?.location?.api?.city || null,
      userName: userRecord?.name || null,
    };

  const subscribersResponse: IChannelServerStats['apps'][0]['channels'][0]['subscribers'][0][] =
    subscribers.map((subscriber) => {
      return {
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
        _id: subscriber._id,
        duration: subscriber.duration,
        bitrate: subscriber.bitrate,
        createdAt: subscriber.createdAt,
        updatedAt: subscriber.updatedAt,
        isLive: subscriber.isLive,
        countryCode: subscriber?.location?.api?.countryCode || null,
        city: subscriber?.location?.api?.city || null,
      };
    });

  const userMap = await userService.getMapByIds(
    relatedStreams.map((stream) => stream.userId?.toString()).filter(Boolean),
  );

  const relatedStreamsResponse: IChannelServerStats['apps'][0]['channels'][0]['publisher'][] =
    await Promise.all(
      relatedStreams.map((stream) => {
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

  ctx.body = {
    stream: streamResponse,
    subscribers: subscribersResponse,
    options,
    info,
    relatedStreams: relatedStreamsResponse,
  };
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

  const paginatedStreams = await Stream.paginate(ctx.queryObj, {
    sort: _.isEmpty(ctx.sortObj) ? { connectCreated: -1 } : ctx.sortObj,
    page: parseInt(ctx.query.page as string) || 1,
    limit: parseInt(ctx.query.limit as string) || 20,
    populate: ['location'],
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
  const uniqueCountries = await IP.distinct('api.country');
  const uniqueApiMessages = await IP.distinct('api.message');

  _.forEach(paginatedStreams.docs, (stream) => {
    hideFields(ctx.state.user, stream);
  });

  const userMap = await userService.getMapByIds(
    paginatedStreams.docs
      .map((stream) => stream.userId?.toString())
      .filter(Boolean),
  );

  const streams: IChannelServerStats['apps'][0]['channels'][0]['publisher'][] =
    await Promise.all(
      paginatedStreams.docs.map((stream) => {
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

  ctx.body = {
    streams,
    options: {
      apps: await Stream.distinct('app', ctx.queryObj),
      channels: await Stream.distinct('channel', ctx.queryObj),
      countries: _.concat(uniqueCountries, uniqueApiMessages),
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
    limit: paginatedStreams.limit,
    page: paginatedStreams.page,
    pages: paginatedStreams.pages,
  };
}

export async function graph(ctx: Router.IRouterContext, next: Next) {
  const stream = await Stream.findById(ctx.params.id);

  if (!stream) {
    throw new Error('stream_not_found');
  }

  const subscribers = await subscriberService
    .getByStreamId(stream._id, ctx.queryObj)
    .sort({ connectCreated: 1 });

  let graph = [];

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
    if (subscriber.isLive) {
      return;
    }

    graph.push({
      eventName: 'subscriberDisconnected',
      time: subscriber.connectUpdated,
      subscribers: filterSubscribers(subscribers, subscriber.connectUpdated),
    });
  });

  if (!stream.isLive) {
    graph.push({
      eventName: 'streamEnded',
      time: stream.connectUpdated,
      subscribers: filterSubscribers(subscribers, stream.connectUpdated),
    });
  } else {
    graph.push({
      eventName: 'streamIsLive',
      time: stream.connectUpdated,
      subscribers: filterSubscribers(subscribers, stream.connectUpdated, true),
    });
  }

  graph = _.sortBy(graph, ['time']);

  ctx.body = { events: graph };
}
