const _ = require('lodash');

function isLive(server, app, channel) {
    return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'publisher'], null) !== null;
}

function getViewers(server, app, channel) {
    return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'subscribers'], []).length;
}

function getBitrate(server, app, channel) {
    return _.get(_.get(global.liveStats, [server], {}), [app, channel, 'publisher', 'bitrate'], 0);
}

function channelStats(req, res, next) {
    let channelStats = {
        isLive: false,
        viewers: 0,
        bitrate: {}
    };

    _.forEach(_.get(global.liveStats, [req.params.server], {}), (channels, appName) => {
        _.forEach(channels, (channelObj, channelName) => {
            if (channelName === req.params.channel) {
                if (channelObj.publisher) {
                    channelStats.isLive = true;
                    channelStats.bitrate[appName] = channelObj.publisher.bitrate;
                }

                channelStats.viewers += channelObj.subscribers.length;
            }
        });
    });

    res.json(channelStats);
}

function appChannelStats(req, res, next) {
    let channelStats = {
        isLive: false,
        viewers: 0,
        bitrate: 0
    };

    channelStats.isLive = isLive(req.params.server, req.params.app, req.params.channel);
    channelStats.viewers = getViewers(req.params.server, req.params.app, req.params.channel);
    channelStats.bitrate = getBitrate(req.params.server, req.params.app, req.params.channel);

    res.json(channelStats);
}

function channels(req, res, next) {
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
