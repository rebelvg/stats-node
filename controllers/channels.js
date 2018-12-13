const _ = require('lodash');

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

function isLive(server, app, channel) {
  return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'publisher'], null) !== null;
}

function getViewers(server, app, channel) {
  return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'subscribers'], []).length;
}

function getDuration(server, app, channel) {
  return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'publisher', 'duration'], 0);
}

function getBitrate(server, app, channel) {
  return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'publisher', 'bitrate'], 0);
}

function getStartTime(server, app, channel) {
  return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'publisher', 'connectCreated'], null);
}

function appChannelStatsBase(server, app, channel) {
  let channelStats = {
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

function channelStats(req, res, next) {
  let channelsStats = {};

  _.forEach(_.get(global.liveStats, [req.params.server], {}), (channels, appName) => {
    _.forEach(channels, (channelObj, channelName) => {
      channelsStats[appName] = appChannelStatsBase(req.params.server, appName, channelName);
    });
  });

  res.json(channelsStats);
}

function appChannelStats(req, res, next) {
  let channelStats = appChannelStatsBase(req.params.server, req.params.app, req.params.channel);

  res.json(channelStats);
}

async function channels(req, res, next) {
  for (let [serverName, serverObj] of Object.entries(global.liveStats)) {
    for (let [appName, appObj] of Object.entries(serverObj)) {
      for (let [channelName, channelObj] of Object.entries(appObj)) {
        if (channelObj.publisher)
          await Stream.populate(channelObj.publisher, {
            path: 'location'
          });

        for (let subscriberObj of channelObj.subscribers) {
          await Subscriber.populate(subscriberObj, {
            path: 'location'
          });
        }
      }
    }
  }

  res.json(global.liveStats);
}

function legacy(req, res, next) {
  let channelStats = {
    isLive: false,
    viewers: 0,
    bitrate_live: 0,
    bitrate_restream: 0,
    title: null
  };

  channelStats.isLive = isLive(req.params.server, 'live', req.params.channel);

  _.forEach(_.get(global.liveStats, [req.params.server], {}), (channels, appName) => {
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

exports.channelStats = channelStats;
exports.appChannelStats = appChannelStats;
exports.channels = channels;
exports.legacy = legacy;
