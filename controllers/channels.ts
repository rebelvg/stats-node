import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import { liveStats } from '../servers';
import { hideFields } from '../helpers/hide-fields';

function isLive(server: string, app: string, channel: string): boolean {
  return !!liveStats?.[server]?.[app]?.[channel]?.publisher;
}

function getViewers(server: string, app: string, channel: string): number {
  return liveStats?.[server]?.[app]?.[channel]?.subscribers?.length || 0;
}

function getDuration(server: string, app: string, channel: string): number {
  return liveStats?.[server]?.[app]?.[channel]?.publisher?.duration || 0;
}

function getBitrate(server: string, app: string, channel: string): number {
  return liveStats?.[server]?.[app]?.[channel]?.publisher?.bitrate || 0;
}

function getStartTime(server: string, app: string, channel: string): Date {
  return liveStats?.[server]?.[app]?.[channel]?.publisher?.connectCreated || null;
}

function appChannelStatsBase(server: string, app: string, channel: string) {
  const channelStats = {
    isLive: false,
    viewers: 0,
    duration: 0,
    bitrate: 0,
    startTime: null
  };

  channelStats.isLive = isLive(server, app, channel);
  channelStats.viewers = getViewers(server, app, channel);
  channelStats.duration = getDuration(server, app, channel);
  channelStats.bitrate = getBitrate(server, app, channel);
  channelStats.startTime = getStartTime(server, app, channel);

  return channelStats;
}

export function channelStats(ctx: Router.IRouterContext, next: Next) {
  const channelsStats = {};

  const { server, channel } = ctx.params;

  _.forEach(liveStats?.[server], (channels, appName) => {
    _.forEach(channels, (channelObj, channelName) => {
      channelsStats[appName] = appChannelStatsBase(server, appName, channel);
    });
  });

  ctx.body = channelsStats;
}

export function appChannelStats(ctx: Router.IRouterContext, next: Next) {
  const channelStats = appChannelStatsBase(ctx.params.server, ctx.params.app, ctx.params.channel);

  ctx.body = channelStats;
}

export async function channels(ctx: Router.IRouterContext, next: Next) {
  const liveStatsClone = _.cloneDeep(liveStats);

  await Promise.all(
    _.map(liveStatsClone, async serverObj => {
      return Promise.all(
        _.map(serverObj, async appObj => {
          return Promise.all(
            _.map(appObj, async channelObj => {
              if (channelObj.publisher) {
                await Stream.populate(channelObj.publisher, {
                  path: 'location'
                });

                hideFields(ctx.state.user, channelObj.publisher);
              }

              for (const subscriberObj of channelObj.subscribers) {
                await Subscriber.populate(subscriberObj, {
                  path: 'location'
                });

                hideFields(ctx.state.user, subscriberObj);
              }
            })
          );
        })
      );
    })
  );

  ctx.body = liveStatsClone;
}

export function legacy(ctx: Router.IRouterContext, next: Next) {
  const channelStats = {
    isLive: false,
    viewers: 0,
    bitrate_live: 0,
    bitrate_restream: 0,
    title: null
  };

  channelStats.isLive = isLive(ctx.params.server, 'live', ctx.params.channel);

  _.forEach(liveStats?.[ctx.params.server], (channels, appName) => {
    _.forEach(channels, (channelObj, channelName) => {
      if (channelName === ctx.params.channel) {
        channelStats.viewers += channelObj.subscribers.length;
      }
    });
  });

  channelStats.bitrate_live = getBitrate(ctx.params.server, 'live', ctx.params.channel);
  channelStats.bitrate_restream = getBitrate(ctx.params.server, 'restream', ctx.params.channel);

  ctx.body = channelStats;
}

export async function list(ctx: Router.IRouterContext, next: Next) {
  const liveChannels = [];

  _.forEach(liveStats, serverObj => {
    _.forEach(serverObj, appObj => {
      _.forEach(appObj, channelObj => {
        if (channelObj.publisher) {
          liveChannels.push(channelObj.publisher.channel);
        }
      });
    });
  });

  const channels = await Stream.distinct('channel');

  ctx.body = { channels, live: liveChannels };
}
