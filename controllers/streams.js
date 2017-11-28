const _ = require('lodash');

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');
const IP = require('../models/ip');

function findById(req, res, next) {
    Stream.findById(req.params.id)
        .populate(['location'])
        .then(async stream => {
            if (!stream) {
                throw new Error('Stream not found.');
            }

            let subscribers = await stream.getSubscribers(req.queryObj).sort(_.isEmpty(req.sortObj) ? {connectCreated: 1} : req.sortObj).populate(['location']);

            let relatedStreams = await stream.getRelatedStreams().sort({connectCreated: 1}).populate(['location']);

            let options = {
                countries: _.concat(
                    _.chain(subscribers).map('location.api.country').compact().uniq().value(),
                    _.chain(subscribers).map('location.api.message').compact().uniq().value()
                ),
                protocols: _.chain(subscribers).map('protocol').uniq().value()
            };

            res.json({stream: stream, subscribers: subscribers, options: options, relatedStreams: relatedStreams});
        })
        .catch(next);
}

function find(req, res, next) {
    Stream.paginate(req.queryObj, {
        sort: _.isEmpty(req.sortObj) ? {connectCreated: -1} : req.sortObj,
        page: req.query.page,
        limit: req.query.limit,
        populate: ['location']
    })
        .then(async ret => {
            let aggregation = await Stream.aggregate([
                {'$match': req.queryObj},
                {
                    '$group': {
                        _id: null,
                        'totalBytes': {
                            '$sum': '$bytes'
                        },
                        'totalDuration': {
                            '$sum': '$duration'
                        },
                        'totalConnections': {
                            '$sum': '$totalConnectionsCount'
                        },
                        'totalPeakViewers': {
                            '$sum': '$peakViewersCount'
                        }
                    }
                }
            ]);

            let uniqueIPs = (await Stream.distinct('ip', req.queryObj)).length;

            res.json({
                streams: ret.docs,
                options: {
                    apps: await Stream.distinct('app', req.queryObj),
                    channels: await Stream.distinct('channel', req.queryObj),
                    countries: _.concat(await IP.distinct('api.country'), await IP.distinct('api.message')),
                    protocols: await Stream.distinct('protocol', req.queryObj)
                },
                info: {
                    totalBytes: _.get(aggregation, ['0', 'totalBytes'], 0),
                    totalDuration: _.get(aggregation, ['0', 'totalDuration'], 0),
                    totalConnections: _.get(aggregation, ['0', 'totalConnections'], 0),
                    totalPeakViewers: _.get(aggregation, ['0', 'totalPeakViewers'], 0),
                    totalIPs: uniqueIPs
                },
                total: ret.total,
                limit: ret.limit,
                page: ret.page,
                pages: ret.pages
            });
        })
        .catch(next);
}

function graph(req, res, next) {
    Stream.findById(req.params.id)
        .then(async stream => {
            if (!stream) {
                throw new Error('Stream not found.');
            }

            let subscribers = await stream.getSubscribers(req.queryObj).sort({connectCreated: 1});

            function filterSubscribers(time, include = false) {
                let compareFnc = include ? _.gte : _.gt;

                return _.filter(subscribers, (subscriber) => {
                    return compareFnc(subscriber.connectUpdated, time)
                        && _.gte(time, subscriber.connectCreated);
                }).map((subscriber) => {
                    return subscriber._id;
                });
            }

            let graph = [];

            graph.push({
                eventName: 'streamStarted',
                time: stream.connectCreated,
                subscribers: filterSubscribers(stream.connectCreated)
            });

            _.forEach(subscribers, (subscriber) => {
                if (stream.connectCreated >= subscriber.connectCreated) return;

                graph.push({
                    eventName: 'subscriberConnected',
                    time: subscriber.connectCreated,
                    subscribers: filterSubscribers(subscriber.connectCreated)
                });
            });

            _.forEach(subscribers, (subscriber) => {
                if (subscriber.connectUpdated >= stream.connectUpdated) return;
                if (subscriber.isLive) return;

                graph.push({
                    eventName: 'subscriberDisconnected',
                    time: subscriber.connectUpdated,
                    subscribers: filterSubscribers(subscriber.connectUpdated)
                });
            });

            if (!stream.isLive) {
                graph.push({
                    eventName: 'streamEnded',
                    time: stream.connectUpdated,
                    subscribers: filterSubscribers(stream.connectUpdated)
                });
            } else {
                graph.push({
                    eventName: 'streamIsLive',
                    time: stream.connectUpdated,
                    subscribers: filterSubscribers(stream.connectUpdated, true)
                });
            }

            graph = _.sortBy(graph, ['time']);

            res.json({stream: stream, events: graph});
        })
        .catch(next);
}

exports.findById = findById;
exports.find = find;
exports.graph = graph;
