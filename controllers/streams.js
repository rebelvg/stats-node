const _ = require('lodash');

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

function findById(req, res, next) {
    Stream.findById(req.params.id)
        .then(async stream => {
            if (!stream) {
                throw new Error('Stream not found.');
            }

            let subscribers = await stream.getSubscribers().sort({connectCreated: 1});

            res.json({stream: stream, subscribers: subscribers});
        })
        .catch(next);
}

function find(req, res, next) {
    Stream.paginate(req.queryObj, {
        sort: req.sortObj,
        page: req.query.page,
        limit: req.query.limit
    })
        .then(ret => {
            res.json({
                streams: ret.docs,
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

            function filterSubscribers(time) {
                return _.filter(subscribers, (subscriber) => {
                    return subscriber.app === stream.app
                        && subscriber.channel === stream.channel
                        && subscriber.connectUpdated > time
                        && subscriber.connectCreated <= time;
                })
            }

            let graph = [];

            graph.push({
                eventName: 'streamStarted',
                time: stream.connectCreated,
                subscribers: filterSubscribers(stream.connectCreated)
            });

            _.forEach(subscribers, (subscriber) => {
                graph.push({
                    eventName: 'subscriberConnected',
                    time: subscriber.connectCreated,
                    subscribers: filterSubscribers(subscriber.connectCreated)
                });
            });

            _.forEach(subscribers, (subscriber) => {
                if (!subscriber.isLive) {
                    graph.push({
                        eventName: 'subscriberDisconnected',
                        time: subscriber.connectUpdated,
                        subscribers: filterSubscribers(subscriber.connectUpdated)
                    });
                }
            });

            if (!stream.isLive) {
                graph.push({
                    eventName: 'streamEnded',
                    time: stream.connectUpdated,
                    subscribers: filterSubscribers(stream.connectUpdated)
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
