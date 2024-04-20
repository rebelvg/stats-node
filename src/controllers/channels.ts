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

function findServerByHost(server: string) {
  return _.find(STREAM_SERVERS, (streamServer) =>
    streamServer.HOSTS.includes(server),
  );
}

function isLive(server: string, app: string, channel: string): boolean {
  const streamServer = findServerByHost(server);

  return !!liveStats?.[streamServer?.NAME]?.[app]?.[channel]?.publisher;
}

function getViewers(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.NAME]?.[app]?.[channel]?.subscribers?.length || 0
  );
}

function getDuration(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.NAME]?.[app]?.[channel]?.publisher?.duration || 0
  );
}

function getBitrate(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.NAME]?.[app]?.[channel]?.publisher?.bitrate || 0
  );
}

function getLastBitrate(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.NAME]?.[app]?.[channel]?.publisher?.lastBitrate ||
    0
  );
}

function getStartTime(server: string, app: string, channel: string): Date {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.NAME]?.[app]?.[channel]?.publisher
      ?.connectCreated || null
  );
}

function appChannelStatsBase(server: string, app: string, channel: string) {
  const channelStats = {
    isLive: false,
    viewers: 0,
    duration: 0,
    bitrate: 0,
    lastBitrate: 0,
    startTime: null,
  };

  channelStats.isLive = isLive(server, app, channel);
  channelStats.viewers = getViewers(server, app, channel);
  channelStats.duration = getDuration(server, app, channel);
  channelStats.bitrate = getBitrate(server, app, channel);
  channelStats.lastBitrate = getLastBitrate(server, app, channel);
  channelStats.startTime = getStartTime(server, app, channel);

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

export async function channels(ctx: Router.IRouterContext, next: Next) {
  const liveStatsClone = _.cloneDeep(liveStats);

  const liveServers = await Promise.all(
    _.map(liveStatsClone, async (serverObj, server) => {
      const apps = await Promise.all(
        _.map(serverObj, async (appObj, app) => {
          const channels = await Promise.all(
            _.map(appObj, async (channelObj, channel) => {
              const liveChannel = {
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

                liveChannel.publisher = channelObj.publisher;
              }

              for (const subscriberObj of channelObj.subscribers) {
                const liveSubscriber = subscriberObj;

                await Subscriber.populate(liveSubscriber, {
                  path: 'location',
                });

                hideFields(ctx.state.user, liveSubscriber);

                liveChannel.subscribers.push(liveSubscriber);
              }

              return liveChannel;
            }),
          );

          const liveApp = {
            app,
            channels,
          };

          return liveApp;
        }),
      );

      const liveServer = {
        server,
        apps,
      };

      return liveServer;
    }),
  );

  ctx.body = { live: liveServers };
}

export async function list(ctx: Router.IRouterContext, next: Next) {
  const liveChannels: {
    app: string;
    channel: string;
    protocol: string;
    name: string;
  }[] = [];

  const channels = (
    await channelService.getChannelsByType(ChannelTypeEnum.PUBLIC)
  ).map((channel) => channel.name);

  await Promise.all(
    _.map(liveStats, (serverObj) => {
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
                    app: channelObj.publisher.app,
                    channel: channelObj.publisher.channel,
                    protocol: channelObj.publisher.protocol,
                    name: userRecord?.name || null,
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
