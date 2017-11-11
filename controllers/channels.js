const _ = require('lodash');

function channelStats(req, res, next) {
    let channelStats = {
        isLive: false,
        viewers: 0,
        bitrate: {}
    };

    _.forEach(global.amsUpdate.live, (channels, appName) => {
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

    channelStats.isLive = _.get(global.amsUpdate.live, [req.params.app, req.params.channel, 'publisher'], null) !== null;
    channelStats.viewers = _.get(global.amsUpdate.live, [req.params.app, req.params.channel, 'subscribers'], []).length;
    channelStats.bitrate = _.get(global.amsUpdate.live, [req.params.app, req.params.channel, 'publisher', 'bitrate'], 0);

    res.json(channelStats);
}

function channels(req, res, next) {
    res.json(global.amsUpdate.live);
}

exports.channelStats = channelStats;
exports.appChannelStats = appChannelStats;
exports.channels = channels;
