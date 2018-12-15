const _ = require('lodash');

const Stream = require('../models/stream');
const IP = require('../models/ip');
const hideFields = require('../helpers/hide-fields');

const filterSubscribers = require('../helpers/filter-subscribers');

function findById(req, res, next) {
  Stream.findById(req.params.id)
    .populate(['location'])
    .then(async stream => {
      if (!stream) {
        throw new Error('Stream not found.');
      }

      const subscribers = await stream
        .getSubscribers(req.queryObj)
        .sort(_.isEmpty(req.sortObj) ? { connectCreated: 1 } : req.sortObj)
        .populate(['location']);

      const relatedStreams = await stream
        .getRelatedStreams()
        .sort({ connectCreated: 1 })
        .populate(['location']);

      const options = {
        countries: _.concat(
          _.chain(subscribers)
            .map('location.api.country')
            .compact()
            .uniq()
            .value(),
          _.chain(subscribers)
            .map('location.api.message')
            .compact()
            .uniq()
            .value()
        ),
        protocols: _.chain(subscribers)
          .map('protocol')
          .uniq()
          .value()
      };

      let totalPeakViewers = 0;

      _.forEach(subscribers, subscriber => {
        const viewersCount = filterSubscribers(subscribers, subscriber.connectCreated).length;

        if (viewersCount > totalPeakViewers) {
          totalPeakViewers = viewersCount;
        }
      });

      const info = {
        totalBytes: _.reduce(
          subscribers,
          (sum, sub) => {
            return sum + sub.bytes;
          },
          0
        ),
        totalDuration: _.reduce(
          subscribers,
          (sum, sub) => {
            return sum + sub.duration;
          },
          0
        ),
        totalPeakViewers: totalPeakViewers,
        totalIPs: _.chain(subscribers)
          .map('ip')
          .uniq()
          .value().length
      };

      if (!req.user) {
        hideFields(stream);

        _.forEach(subscribers, subscriber => {
          hideFields(subscriber);
        });
      }

      res.json({
        stream: stream,
        subscribers: subscribers,
        options: options,
        info: info,
        relatedStreams: relatedStreams
      });
    })
    .catch(next);
}

function find(req, res, next) {
  Stream.paginate(req.queryObj, {
    sort: _.isEmpty(req.sortObj) ? { connectCreated: -1 } : req.sortObj,
    page: req.query.page,
    limit: req.query.limit,
    populate: ['location']
  })
    .then(async ret => {
      const aggregation = await Stream.aggregate([
        { $match: req.queryObj },
        {
          $group: {
            _id: null,
            totalBytes: {
              $sum: '$bytes'
            },
            totalDuration: {
              $sum: '$duration'
            },
            totalConnections: {
              $sum: '$totalConnectionsCount'
            },
            totalPeakViewers: {
              $sum: '$peakViewersCount'
            }
          }
        }
      ]);

      const uniqueIPs = (await Stream.distinct('ip', req.queryObj)).length;

      if (!req.user) {
        _.forEach(ret.docs, stream => {
          hideFields(stream);
        });
      }

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

      const subscribers = await stream.getSubscribers(req.queryObj).sort({ connectCreated: 1 });

      let graph = [];

      graph.push({
        eventName: 'streamStarted',
        time: stream.connectCreated,
        subscribers: filterSubscribers(subscribers, stream.connectCreated)
      });

      _.forEach(subscribers, subscriber => {
        if (stream.connectCreated >= subscriber.connectCreated) {
          return;
        }

        graph.push({
          eventName: 'subscriberConnected',
          time: subscriber.connectCreated,
          subscribers: filterSubscribers(subscribers, subscriber.connectCreated)
        });
      });

      _.forEach(subscribers, subscriber => {
        if (subscriber.connectUpdated >= stream.connectUpdated) {
          return;
        }
        if (subscriber.isLive) {
          return;
        }

        graph.push({
          eventName: 'subscriberDisconnected',
          time: subscriber.connectUpdated,
          subscribers: filterSubscribers(subscribers, subscriber.connectUpdated)
        });
      });

      if (!stream.isLive) {
        graph.push({
          eventName: 'streamEnded',
          time: stream.connectUpdated,
          subscribers: filterSubscribers(subscribers, stream.connectUpdated)
        });
      } else {
        graph.push({
          eventName: 'streamIsLive',
          time: stream.connectUpdated,
          subscribers: filterSubscribers(subscribers, stream.connectUpdated, true)
        });
      }

      graph = _.sortBy(graph, ['time']);

      if (!req.user) {
        hideFields(stream);
      }

      res.json({ stream: stream, events: graph });
    })
    .catch(next);
}

exports.findById = findById;
exports.find = find;
exports.graph = graph;
