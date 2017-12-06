const _ = require('lodash');
const moment = require('moment');
const strtotime = require('locutus/php/datetime/strtotime');

const IP = require('../models/ip');

function parseFilter(model) {
    return async function (req, res, next) {
        let rules = {
            app: {
                do: [],
                test: [_.isString],
                cb: function (app) {
                    queryObj.app = new RegExp(app, 'gi');
                }
            },
            channel: {
                do: [],
                test: [_.isString],
                cb: function (channel) {
                    queryObj.channel = new RegExp(channel, 'gi');
                }
            },
            connectCreated: {
                do: [strtotime, moment.unix, (value) => value.toDate()],
                test: [_.isDate],
                cb: function (connectCreated) {
                    queryObj.connectCreated = {
                        $gte: connectCreated
                    };
                }
            },
            connectUpdated: {
                do: [strtotime, moment.unix, (value) => value.toDate()],
                test: [_.isDate],
                cb: function (connectUpdated) {
                    queryObj.connectUpdated = {
                        $gte: connectUpdated
                    };
                }
            },
            bytes: {
                do: [_.toNumber],
                test: [_.isFinite],
                cb: function (bytes) {
                    queryObj.bytes = {
                        $gte: bytes * 1024 * 1024
                    };
                }
            },
            ip: {
                do: [],
                test: [_.isString],
                cb: async function (ip) {
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
                do: [],
                test: [_.isString],
                cb: function (protocol) {
                    queryObj.protocol = new RegExp(protocol, 'gi');
                }
            },
            duration: {
                do: [_.toNumber],
                test: [_.isFinite],
                cb: function (duration) {
                    queryObj.duration = {
                        $gte: duration * 60
                    };
                }
            },
            bitrate: {
                do: [_.toNumber],
                test: [_.isFinite],
                cb: function (bitrate) {
                    queryObj.bitrate = {
                        $gte: bitrate
                    };
                }
            },
            totalConnectionsCount: {
                do: [_.toNumber],
                test: [_.isFinite],
                cb: function (totalConnectionsCount) {
                    queryObj.totalConnectionsCount = {
                        $gte: totalConnectionsCount
                    };
                }
            },
            peakViewersCount: {
                do: [_.toNumber],
                test: [_.isFinite],
                cb: function (peakViewersCount) {
                    queryObj.peakViewersCount = {
                        $gte: peakViewersCount
                    };
                }
            }
        };

        let queryObj = {};

        loop1: for (let [fieldName, rule] of Object.entries(rules)) {
            if (req.query.hasOwnProperty(fieldName) && model.schema.paths.hasOwnProperty(fieldName)) {
                try {
                    let value = req.query[fieldName];

                    _.forEach(rule.do, (fnc) => {
                        value = fnc(value);
                    });

                    for (let fnc of rule.test) {
                        if (!fnc(value)) continue loop1;
                    }

                    await rule.cb(value);
                }
                catch (e) {
                }
            }
        }

        req.queryObj = queryObj;

        next();
    };
}

module.exports = parseFilter;
