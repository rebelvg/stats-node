const _ = require('lodash');
const moment = require('moment');
const strtotime = require('locutus/php/datetime/strtotime');

const IP = require('../models/ip');

function parseFilter(model) {
    return async function (req, res, next) {
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
                        $gte: moment.unix(strtotime(connectCreated)).toDate()
                    };
                }
            },
            connectUpdated: {
                type: 'string', cb: function (connectUpdated) {
                    queryObj.connectUpdated = {
                        $gte: moment.unix(strtotime(connectUpdated)).toDate()
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
                type: 'string', cb: async function (ip) {
                    let ips = await IP.distinct('ip', {
                        $or: [
                            {'ip': new RegExp(ip, 'gi')},
                            {'api.country': new RegExp(ip, 'gi')},
                            {'api.city': new RegExp(ip, 'gi')},
                            {'api.isp': new RegExp(ip, 'gi')},
                            {'api.countryCode': new RegExp(ip, 'gi')},
                            {'api.message': new RegExp(ip, 'gi')}
                        ]
                    });

                    queryObj.$or = [
                        {ip: {$in: ips}},
                        {ip: new RegExp(ip, 'gi')}
                    ];
                }
            },
            protocol: {
                type: 'string', cb: function (protocol) {
                    queryObj.protocol = new RegExp(protocol, 'gi');
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
            totalConnectionsCount: {
                type: 'string', cb: function (totalConnectionsCount) {
                    totalConnectionsCount = parseInt(totalConnectionsCount);

                    if (isNaN(totalConnectionsCount)) {
                        return;
                    }

                    queryObj.totalConnectionsCount = {
                        $gte: totalConnectionsCount
                    };
                }
            },
            peakViewersCount: {
                type: 'string', cb: function (peakViewersCount) {
                    peakViewersCount = parseInt(peakViewersCount);

                    if (isNaN(peakViewersCount)) {
                        return;
                    }

                    queryObj.peakViewersCount = {
                        $gte: peakViewersCount
                    };
                }
            }
        };

        let queryObj = {};

        for (let querySetting of Object.entries(querySettings)) {
            const [fieldName, rules] = querySetting;

            if (req.query.hasOwnProperty(fieldName) && model.schema.paths.hasOwnProperty(fieldName)) {
                if (typeof req.query[fieldName] === rules.type) {
                    await rules.cb(req.query[fieldName]);
                }
            }
        }

        req.queryObj = queryObj;

        next();
    };
}

module.exports = parseFilter;
