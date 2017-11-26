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

            let subscribers = await stream.getSubscribers().sort({connectCreated: 1}).populate(['location']);

            let relatedStreams = await stream.getRelatedStreams().sort({connectCreated: 1}).populate(['location']);

            res.json({stream: stream, subscribers: subscribers, relatedStreams: relatedStreams});
        })
        .catch(next);
}

function find(req, res, next) {
    Stream.paginate(req.queryObj, {
        sort: req.sortObj,
        page: req.query.page,
        limit: req.query.limit,
        populate: ['location']
    })
        .then(async ret => {
            res.json({
                streams: ret.docs,
                options: {
                    apps: await Stream.distinct('app', req.queryObj),
                    channels: await Stream.distinct('channel', req.queryObj),
                    countries: await IP.distinct('api.country'),
                    protocols: await Stream.distinct('protocol', req.queryObj)
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

            let subscribers = await stream.getSubscribers().sort({connectCreated: 1});

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
