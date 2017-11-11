const _ = require('lodash');

const Stream = require('../models/stream');
const Subscriber = require('../models/subscriber');

function findById(req, res, next) {
    Stream.findById(req.params.id)
        .then(async stream => {
            if (!stream) {
                throw new Error('Stream not found.');
            }

            let subscribers = await stream.getSubscribers().sort({_id: 1});

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

            let subscribers = await stream.getSubscribers().sort({timeConnected: 1});

            function filterSubscribers(time) {
                return _.filter(subscribers, (subscriber) => {
                    return subscriber.app === stream.app
                        && subscriber.channel === stream.channel
                        && subscriber.updatedAt > time
                        && subscriber.timeConnected <= time;
                })
            }

            let graph = [];

            graph.push({
                eventName: 'streamStarted',
                time: stream.timeConnected,
                subscribers: filterSubscribers(stream.timeConnected)
            });

            _.forEach(subscribers, (subscriber) => {
                graph.push({
                    eventName: 'subscriberConnected',
                    time: subscriber.timeConnected,
                    subscribers: filterSubscribers(subscriber.timeConnected)
                });
            });

            _.forEach(subscribers, (subscriber) => {
                if (!subscriber.isLive) {
                    graph.push({
                        eventName: 'subscriberDisconnected',
                        time: subscriber.updatedAt,
                        subscribers: filterSubscribers(subscriber.updatedAt)
                    });
                }
            });

            if (!stream.isLive) {
                graph.push({
                    eventName: 'streamEnded',
                    time: stream.updatedAt,
                    subscribers: filterSubscribers(stream.updatedAt)
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
