const _ = require('lodash');

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

    channelStats.isLive = _.get(_.get(global.liveStats, [req.params.server], {}), [req.params.app, req.params.channel, 'publisher'], null) !== null;
    channelStats.viewers = _.get(_.get(global.liveStats, [req.params.server], {}), [req.params.app, req.params.channel, 'subscribers'], []).length;
    channelStats.bitrate = _.get(_.get(global.liveStats, [req.params.server], {}), [req.params.app, req.params.channel, 'publisher', 'bitrate'], 0);

    res.json(channelStats);
}

function channels(req, res, next) {
    res.json(global.liveStats);
}

exports.channelStats = channelStats;
exports.appChannelStats = appChannelStats;
exports.channels = channels;
