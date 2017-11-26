const Subscriber = require('../models/subscriber');
const Stream = require('../models/stream');
const IP = require('../models/ip');

function findById(req, res, next) {
    Subscriber.findById(req.params.id)
        .populate(['location'])
        .then(async subscriber => {
            if (!subscriber) {
                throw new Error('Subscriber not found.');
            }

            let streams = await subscriber.getStreams().sort({connectCreated: 1}).populate(['location']);

            res.json({subscriber: subscriber, streams: streams});
        })
        .catch(next);
}

function find(req, res, next) {
    Subscriber.paginate(req.queryObj, {
        sort: req.sortObj,
        page: req.query.page,
        limit: req.query.limit,
        populate: ['location']
    })
        .then(async ret => {
            res.json({
                subscribers: ret.docs,
                options: {
                    apps: await Subscriber.distinct('app', req.queryObj),
                    channels: await Subscriber.distinct('channel', req.queryObj),
                    countries: await IP.distinct('api.country'),
                    protocols: await Subscriber.distinct('protocol', req.queryObj)
                },
                total: ret.total,
                limit: ret.limit,
                page: ret.page,
                pages: ret.pages
            });
        })
        .catch(next);
}

exports.findById = findById;
exports.find = find;
