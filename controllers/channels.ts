import * as express from 'express';
import * as _ from 'lodash';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import { liveStats } from '../servers';

function isLive(server: string, app: string, channel: string): boolean {
  return liveStats?.[server]?.[app]?.[channel]?.publisher !== null;
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

export function channelStats(req: express.Request, res: express.Response, next: express.NextFunction) {
  const channelsStats = {};

  _.forEach(liveStats?.[req.params.server], (channels, appName) => {
    _.forEach(channels, (channelObj, channelName) => {
      channelsStats[appName] = appChannelStatsBase(req.params.server, appName, channelName);
    });
  });

  res.json(channelsStats);
}

export function appChannelStats(req: express.Request, res: express.Response, next: express.NextFunction) {
  const channelStats = appChannelStatsBase(req.params.server, req.params.app, req.params.channel);

  res.json(channelStats);
}

export async function channels(req: express.Request, res: express.Response, next: express.NextFunction) {
  await Promise.all(
    _.map(liveStats, serverObj => {
      return _.map(serverObj, appObj => {
        return _.map(appObj, async channelObj => {
          if (channelObj.publisher) {
            await Stream.populate(channelObj.publisher, {
              path: 'location'
            });
          }

          for (const subscriberObj of channelObj.subscribers) {
            await Subscriber.populate(subscriberObj, {
              path: 'location'
            });
          }
        });
      });
    })
  );

  res.json(liveStats);
}

export function legacy(req: express.Request, res: express.Response, next: express.NextFunction) {
  const channelStats = {
    isLive: false,
    viewers: 0,
    bitrate_live: 0,
    bitrate_restream: 0,
    title: null
  };

  channelStats.isLive = isLive(req.params.server, 'live', req.params.channel);

  _.forEach(liveStats?.[req.params.server], (channels, appName) => {
    _.forEach(channels, (channelObj, channelName) => {
      if (channelName === req.params.channel) {
        channelStats.viewers += channelObj.subscribers.length;
      }
    });
  });

  channelStats.bitrate_live = getBitrate(req.params.server, 'live', req.params.channel);
  channelStats.bitrate_restream = getBitrate(req.params.server, 'restream', req.params.channel);

  res.json(channelStats);
}

export async function list(req: express.Request, res: express.Response, next: express.NextFunction) {
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

  res.json({ channels, live: liveChannels });
}
