import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { Stream } from '../models/stream';
import { filterSubscribers } from '../helpers/filter-subscribers';
import { streamService } from '../services/stream';
import { subscriberService } from '../services/subscriber';
import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { userService } from '../services/user';
import { ObjectId } from 'mongodb';
import { IUserModel } from '../models/user';
import { IChannelServerStats } from '../helpers/interfaces';

export async function findById(ctx: Router.RouterContext, next: Next) {
  const streamRecord = await Stream.findOne({
    _id: new ObjectId(ctx.params.id),
  });

  if (!streamRecord) {
    throw new Error('stream_not_found');
  }

  const subscriberRecords = await subscriberService.getByStreamId(
    streamRecord._id,
    ctx.state.query,
    {
      sort: _.isEmpty(ctx.state.sort) ? { connectCreated: 1 } : ctx.state.sort,
    },
  );

  const relatedStreamRecords = await streamService.getRelatedStreams(
    streamRecord,
    {
      sort: {
        connectCreated: 1,
      },
    },
  );

  const options = {
    countries: [],
    protocols: _.chain(subscriberRecords).map('protocol').uniq().value(),
  };

  let totalPeakViewers = 0;

  _.forEach(subscriberRecords, (subscriber) => {
    const viewersCount = filterSubscribers(
      subscriberRecords,
      subscriber.connectCreated,
    ).length;

    if (viewersCount > totalPeakViewers) {
      totalPeakViewers = viewersCount;
    }
  });

  const info = {
    totalBytes: _.reduce(
      subscriberRecords,
      (sum, sub) => {
        return sum + sub.bytes;
      },
      0,
    ),
    totalDuration: _.reduce(
      subscriberRecords,
      (sum, sub) => {
        return sum + sub.duration;
      },
      0,
    ),
    totalPeakViewers,
    totalIPs: _.chain(subscriberRecords).map('ip').uniq().value().length,
  };

  let userRecord: IUserModel | null = null;

  if (streamRecord.userId) {
    userRecord = await userService.getById(streamRecord.userId.toString());
  }

  const isLive = streamRecord.connectUpdated > new Date(Date.now() - 30 * 1000);

  const stream: IChannelServerStats['apps'][0]['channels'][0]['publisher'] = {
    _id: streamRecord._id.toString(),
    server: streamRecord.server,
    app: streamRecord.app,
    channel: streamRecord.channel,
    connectId: streamRecord.connectId,
    connectCreated: streamRecord.connectCreated,
    connectUpdated: streamRecord.connectUpdated,
    bytes: streamRecord.bytes,
    protocol: streamRecord.protocol,
    lastBitrate: streamRecord.lastBitrate,
    userId: streamRecord.userId?.toString() || null,
    totalConnectionsCount: streamRecord.totalConnectionsCount,
    peakViewersCount: streamRecord.peakViewersCount,
    duration: streamRecord.duration,
    bitrate: streamRecord.bitrate,
    createdAt: streamRecord.createdAt,
    updatedAt: streamRecord.updatedAt,
    isLive,
    userName: userRecord?.name || null,
  };

  const subscribers = subscriberRecords.map(
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

  const userMap = await userService.getMapByIds(
    relatedStreamRecords
      .filter((s) => s.userId)
      .map((stream) => stream.userId!.toString()),
  );

  const relatedStreams = await Promise.all(
    relatedStreamRecords.map(
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

  ctx.body = {
    stream,
    subscribers,
    options,
    info,
    relatedStreams,
  };
}

export async function find(ctx: Router.RouterContext, next: Next) {
  const isAdmin = !!ctx.state.user?.isAdmin;

  if (!isAdmin) {
    const channels = await channelService.getChannelsByType(
      ChannelTypeEnum.PUBLIC,
    );

    const channelNames = channels.map((c) => c.name);

    if (!ctx.state.query.$and) {
      ctx.state.query.$and = [];
    }

    ctx.state.query.$and.push({
      channel: {
        $in: channelNames,
      },
    });
  }

  const limit = parseInt(ctx.query.limit as string) || 20;
  const page = parseInt(ctx.query.page as string) || 1;
  const skip = (page - 1) * limit;

  const paginatedStreams = await Stream.paginate(ctx.state.query, {
    sort: _.isEmpty(ctx.state.sort) ? { connectCreated: -1 } : ctx.state.sort,
    skip,
    limit,
  });

  const aggregation = await Stream.aggregate([
    { $match: ctx.state.query },
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

  const uniqueIPs = await Stream.distinct('ip', ctx.state.query);

  const userMap = await userService.getMapByIds(
    paginatedStreams.docs
      .filter((s) => s.userId)
      .map((stream) => stream.userId!.toString()),
  );

  const streams = await Promise.all(
    paginatedStreams.docs.map(
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

  ctx.body = {
    streams,
    options: {
      apps: await Stream.distinct('app', ctx.state.query),
      channels: await Stream.distinct('channel', ctx.state.query),
      countries: [],
      protocols: await Stream.distinct('protocol', ctx.state.query),
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
    ctx.state.query,
    {
      sort: { connectCreated: 1 },
    },
  );

  let graph: {
    eventName: string;
    time: Date;
    subscribers: ObjectId[];
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

    if (subscriber.connectUpdated > new Date(Date.now() - 30 * 1000)) {
      return;
    }

    graph.push({
      eventName: 'subscriberDisconnected',
      time: subscriber.connectUpdated,
      subscribers: filterSubscribers(subscribers, subscriber.connectUpdated),
    });
  });

  if (stream.connectUpdated > new Date(Date.now() - 30 * 1000)) {
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
