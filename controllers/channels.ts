import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import { liveStats, STREAM_SERVERS } from '../workers';
import { hideFields } from '../helpers/hide-fields';

function findServerByHost(server: string) {
  return _.find(STREAM_SERVERS, (streamServer) =>
    streamServer.hosts.includes(server),
  );
}

function isLive(server: string, app: string, channel: string): boolean {
  const streamServer = findServerByHost(server);

  return !!liveStats?.[streamServer?.name]?.[app]?.[channel]?.publisher;
}

function getViewers(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.name]?.[app]?.[channel]?.subscribers?.length || 0
  );
}

function getDuration(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.name]?.[app]?.[channel]?.publisher?.duration || 0
  );
}

function getBitrate(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.name]?.[app]?.[channel]?.publisher?.bitrate || 0
  );
}

function getLastBitrate(server: string, app: string, channel: string): number {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.name]?.[app]?.[channel]?.publisher?.lastBitrate ||
    0
  );
}

function getStartTime(server: string, app: string, channel: string): Date {
  const streamServer = findServerByHost(server);

  return (
    liveStats?.[streamServer?.name]?.[app]?.[channel]?.publisher
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

  await Promise.all(
    _.map(liveStatsClone, (serverObj) => {
      return Promise.all(
        _.map(serverObj, (appObj) => {
          return Promise.all(
            _.map(appObj, async (channelObj) => {
              if (channelObj.publisher) {
                await Stream.populate(channelObj.publisher, {
                  path: 'location',
                });

                hideFields(ctx.state.user, channelObj.publisher);
              }

              for (const subscriberObj of channelObj.subscribers) {
                await Subscriber.populate(subscriberObj, {
                  path: 'location',
                });

                hideFields(ctx.state.user, subscriberObj);
              }
            }),
          );
        }),
      );
    }),
  );

  ctx.body = liveStatsClone;
}

export async function list(ctx: Router.IRouterContext, next: Next) {
  const liveChannels = [];

  _.forEach(liveStats, (serverObj) => {
    _.forEach(serverObj, (appObj) => {
      _.forEach(appObj, (channelObj) => {
        if (channelObj.publisher) {
          liveChannels.push({
            app: channelObj.publisher.app,
            channel: channelObj.publisher.channel,
          });
        }
      });
    });
  });

  const channels = await Stream.distinct('channel');

  ctx.body = { channels, live: liveChannels };
}
