const _ = require('lodash');

function parseFilter(model) {
    return function (req, res, next) {
        let querySettings = {
            app: {
                type: 'string', cb: function (app) {
                    queryObj.app = new RegExp(app, 'gi');
                }
            },
            channel: {
                type: 'string', cb: function (channel) {
                    queryObj.channel = new RegExp(channel, 'gi');
                }
            },
            connectCreated: {
                type: 'string', cb: function (connectCreated) {
                    queryObj.connectCreated = {
                        $gte: new Date(connectCreated)
                    };
                }
            },
            bytes: {
                type: 'string', cb: function (bytes) {
                    bytes = parseInt(bytes);

                    if (isNaN(bytes)) {
                        return;
                    }

                    queryObj.bytes = {
                        $gte: bytes * 1024 * 1024
                    };
                }
            },
            ip: {
                type: 'string', cb: function (ip) {
                    queryObj.ip = new RegExp(ip, 'gi');
                }
            },
            duration: {
                type: 'string', cb: function (duration) {
                    duration = parseInt(duration);

                    if (isNaN(duration)) {
                        return;
                    }

                    queryObj.duration = {
                        $gte: duration * 60
                    };
                }
            },
            bitrate: {
                type: 'string', cb: function (bitrate) {
                    bitrate = parseInt(bitrate);

                    if (isNaN(bitrate)) {
                        return;
                    }

                    queryObj.bitrate = {
                        $gte: bitrate
                    };
                }
            },
            viewersCount: {
                type: 'string', cb: function (viewersCount) {
                    viewersCount = parseInt(viewersCount);

                    if (isNaN(viewersCount)) {
                        return;
                    }

                    queryObj.viewersCount = {
                        $gte: viewersCount
                    };
                }
            }
        };

        let queryObj = {};

        _.forEach(querySettings, (rules, fieldName) => {
            if (req.query.hasOwnProperty(fieldName) && model.schema.paths.hasOwnProperty(fieldName)) {
                if (typeof req.query[fieldName] === rules.type) {
                    rules.cb(req.query[fieldName]);
                }
            }

        });

        req.queryObj = queryObj;

        next();
    };
}

module.exports = parseFilter;
