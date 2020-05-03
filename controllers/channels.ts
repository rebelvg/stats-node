import * as _ from 'lodash';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import { liveStats } from '../servers';

function isLive(server, app, channel) {
  return _.get(_.get(liveStats, [server], {}), [app, channel, 'publisher'], null) !== null;
}

function getViewers(server, app, channel) {
  return _.get(_.get(liveStats, [server], {}), [app, channel, 'subscribers'], []).length;
}

function getDuration(server, app, channel) {
  return _.get(_.get(liveStats, [server], {}), [app, channel, 'publisher', 'duration'], 0);
}

function getBitrate(server, app, channel) {
  return _.get(_.get(liveStats, [server], {}), [app, channel, 'publisher', 'bitrate'], 0);
}

function getStartTime(server, app, channel) {
  return _.get(_.get(liveStats, [server], {}), [app, channel, 'publisher', 'connectCreated'], null);
}

function appChannelStatsBase(server, app, channel) {
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

export function channelStats(req, res, next) {
  const channelsStats = {};

  _.forEach(_.get(liveStats, [req.params.server], {}), (channels, appName) => {
    _.forEach(channels, (channelObj, channelName) => {
      channelsStats[appName] = appChannelStatsBase(req.params.server, appName, channelName);
    });
  });

  res.json(channelsStats);
}

export function appChannelStats(req, res, next) {
  const channelStats = appChannelStatsBase(req.params.server, req.params.app, req.params.channel);

  res.json(channelStats);
}

export async function channels(req, res, next) {
  for (const [_serverName, serverObj] of Object.entries(liveStats)) {
    for (const [_appName, appObj] of Object.entries(serverObj)) {
      for (const [_channelName, channelObj] of Object.entries(appObj)) {
        if ((channelObj as any).publisher) {
          await Stream.populate((channelObj as any).publisher, {
            path: 'location'
          });
        }

        for (const subscriberObj of (channelObj as any).subscribers) {
          await Subscriber.populate(subscriberObj, {
            path: 'location'
          });
        }
      }
    }
  }

  res.json(liveStats);
}

export function legacy(req, res, next) {
  const channelStats = {
    isLive: false,
    viewers: 0,
    bitrate_live: 0,
    bitrate_restream: 0,
    title: null
  };

  channelStats.isLive = isLive(req.params.server, 'live', req.params.channel);

  _.forEach(_.get(liveStats, [req.params.server], {}), (channels, appName) => {
    _.forEach(channels, (channelObj: any, channelName) => {
      if (channelName === req.params.channel) {
        channelStats.viewers += channelObj.subscribers.length;
      }
    });
  });

  channelStats.bitrate_live = getBitrate(req.params.server, 'live', req.params.channel);
  channelStats.bitrate_restream = getBitrate(req.params.server, 'restream', req.params.channel);

  res.json(channelStats);
}

export async function list(req, res, next) {
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
