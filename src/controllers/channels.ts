import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import { liveStats, STREAM_SERVERS } from '../workers';
import { hideFields } from '../helpers/hide-fields';
import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { BadRequest } from '../helpers/errors';
import { userService } from '../services/user';

function appChannelStatsBase(server: string, app: string, channel: string) {
  const channelStats = {
    isLive: false,
    viewers: 0,
    duration: 0,
    bitrate: 0,
    lastBitrate: 0,
    _id: null,
    startTime: null,
  };

  const streamServer = _.find(STREAM_SERVERS, (streamServer) =>
    streamServer.HOSTS.includes(server),
  );

  if (!streamServer) {
    return channelStats;
  }

  const channelRecord = liveStats[streamServer.NAME]?.[app]?.[channel];

  if (!channelRecord) {
    return channelStats;
  }

  channelStats.isLive = !!channelRecord.publisher;
  channelStats.viewers = channelRecord.subscribers?.length || 0;
  channelStats.duration = channelRecord.publisher?.duration || 0;
  channelStats.bitrate = channelRecord.publisher?.bitrate || 0;
  channelStats.lastBitrate = channelRecord.publisher?.lastBitrate || 0;
  channelStats._id = channelRecord.publisher?.connectCreated || null;
  channelStats.startTime = channelRecord.publisher?.connectCreated || null;

  return channelStats;
}

export function appChannelStats(ctx: Router.IRouterContext, next: Next) {
  const channelStats = appChannelStatsBase(
    ctx.params.server,
    ctx.params.app,
    ctx.params.channel,
  );

  ctx.body = channelStats;
}

interface IChannelServerStats {
  server: string;
  apps: {
    app: string;
    channels: {
      channel: string;
      publisher: {
        server: string;
        app: string;
        channel: string;
        connectId: string;
        connectCreated: Date;
        connectUpdated: Date;
        bytes: number;
        ip: string;
        protocol: string;
        lastBitrate: number;
        userId: string | null;
        _id: string;
        totalConnectionsCount: number;
        peakViewersCount: number;
        duration: number;
        bitrate: number;
        createdAt: Date;
        updatedAt: Date;
        isLive: boolean;
        location: {
          countryCode: string;
          city: string;
        };
        userName: string | null;
      } | null;
      subscribers: {
        server: string;
        app: string;
        channel: string;
        connectId: string;
        connectCreated: Date;
        connectUpdated: Date;
        bytes: number;
        ip: string;
        protocol: string;
        userId: string | null;
        streamIds: string[];
        _id: string;
        duration: number;
        bitrate: number;
        createdAt: Date;
        updatedAt: Date;
        isLive: boolean;
        location: {
          countryCode: string;
          city: string;
        };
      }[];
    }[];
  }[];
}

export async function channels(ctx: Router.IRouterContext, next: Next) {
  const liveStatsClone = _.cloneDeep(liveStats);

  const isAdmin = !!ctx.state.user?.isAdmin;

  const publicChannelNames = (
    await channelService.getChannelsByType(ChannelTypeEnum.PRIVATE)
  ).map((channel) => channel.name);

  const liveServers: IChannelServerStats[] = [];

  for (const server in liveStatsClone) {
    const serverObj = liveStatsClone[server];

    if (!serverObj) {
      continue;
    }

    const liveServer = {
      server,
      apps: [],
    };

    for (const app in serverObj) {
      const appObj = serverObj[app];

      if (!appObj) {
        continue;
      }

      const channels: IChannelServerStats['apps'][0]['channels'] = [];

      for (const channel in appObj) {
        const channelObj = appObj[channel];

        if (!isAdmin) {
          if (!publicChannelNames.includes(channel)) {
            continue;
          }
        }

        const liveChannel: IChannelServerStats['apps'][0]['channels'][0] = {
          channel,
          publisher: null,
          subscribers: [],
        };

        if (channelObj.publisher) {
          const livePublisher = channelObj.publisher;

          await Stream.populate(livePublisher, {
            path: 'location',
          });

          hideFields(ctx.state.user, livePublisher);

          const userRecord = await userService.getById(
            channelObj.publisher.userId?.toString(),
          );

          liveChannel.publisher = {
            server: livePublisher.server,
            app: livePublisher.app,
            channel: livePublisher.channel,
            connectId: livePublisher.connectId,
            connectCreated: livePublisher.connectCreated,
            connectUpdated: livePublisher.connectUpdated,
            bytes: livePublisher.bytes,
            ip: livePublisher.ip,
            protocol: livePublisher.protocol,
            lastBitrate: livePublisher.lastBitrate,
            userId: livePublisher.userId?.toString() || null,
            _id: livePublisher._id,
            totalConnectionsCount: livePublisher.totalConnectionsCount,
            peakViewersCount: livePublisher.peakViewersCount,
            duration: livePublisher.duration,
            bitrate: livePublisher.bitrate,
            createdAt: livePublisher.createdAt,
            updatedAt: livePublisher.updatedAt,
            isLive: livePublisher.isLive,
            location: {
              countryCode: livePublisher?.location?.api?.countryCode || null,
              city: livePublisher?.location?.api?.city || null,
            },
            userName: userRecord?.name || null,
          };
        }

        for (const subscriberObj of channelObj.subscribers) {
          const liveSubscriber = subscriberObj;

          await Subscriber.populate(liveSubscriber, {
            path: 'location',
          });

          hideFields(ctx.state.user, liveSubscriber);

          liveChannel.subscribers.push({
            server: liveSubscriber.server,
            app: liveSubscriber.app,
            channel: liveSubscriber.channel,
            connectId: liveSubscriber.connectId,
            connectCreated: liveSubscriber.connectCreated,
            connectUpdated: liveSubscriber.connectUpdated,
            bytes: liveSubscriber.bytes,
            ip: liveSubscriber.ip,
            protocol: liveSubscriber.protocol,
            userId: liveSubscriber.userId?.toString() || null,
            streamIds: liveSubscriber.streamIds.map((e) => e.toString()),
            _id: liveSubscriber._id,
            duration: liveSubscriber.duration,
            bitrate: liveSubscriber.bitrate,
            createdAt: liveSubscriber.createdAt,
            updatedAt: liveSubscriber.updatedAt,
            isLive: liveSubscriber.isLive,
            location: {
              countryCode: liveSubscriber?.location?.api?.countryCode || null,
              city: liveSubscriber?.location?.api?.city || null,
            },
          });
        }

        channels.push(liveChannel);
      }

      const liveApp = {
        app,
        channels,
      };

      if (liveApp.channels.length > 0) {
        liveServer.apps.push(liveApp);
      }
    }

    if (liveServer.apps.length > 0) {
      liveServers.push(liveServer);
    }
  }

  ctx.body = { live: liveServers };
}

export async function list(ctx: Router.IRouterContext, next: Next) {
  const liveChannels: {
    server: string;
    app: string;
    channel: string;
    protocol: string;
    name: string;
    _id: string;
    startTime: Date;
    viewers: number;
  }[] = [];

  const channels = (
    await channelService.getChannelsByType(ChannelTypeEnum.PUBLIC)
  ).map((channel) => channel.name);

  await Promise.all(
    _.map(liveStats, (serverObj, serverName) => {
      return Promise.all(
        _.map(serverObj, (appObj) => {
          return Promise.all(
            _.map(appObj, async (channelObj) => {
              if (channelObj.publisher) {
                if (channels.includes(channelObj.publisher.channel)) {
                  const userRecord = await userService.getById(
                    channelObj.publisher.userId?.toString(),
                  );

                  liveChannels.push({
                    server: serverName,
                    app: channelObj.publisher.app,
                    channel: channelObj.publisher.channel,
                    protocol: channelObj.publisher.protocol,
                    name: userRecord?.name || null,
                    _id: channelObj.publisher._id,
                    startTime: channelObj.publisher.connectCreated,
                    viewers: channelObj.subscribers.length,
                  });
                }
              }
            }),
          );
        }),
      );
    }),
  );

  ctx.body = {
    channels,
    live: liveChannels,
  };
}

export async function updateChannel(ctx: Router.IRouterContext, next: Next) {
  const { id } = ctx.params;
  const { type } = ctx.request.body;

  if (!Object.values(ChannelTypeEnum).includes(type)) {
    throw new BadRequest('bad_type');
  }

  await channelService.setType(id, type);

  ctx.status = 201;
}
