const Subscriber = require('../models/subscriber');
const Stream = require('../models/stream');

function findById(req, res, next) {
    Subscriber.findById(req.params.id)
        .then(async subscriber => {
            if (!subscriber) {
                throw new Error('Subscriber not found.');
            }

            let streams = await subscriber.getStreams().sort({connectCreated: 1});

            res.json({subscriber: subscriber, streams: streams});
        })
        .catch(next);
}

function find(req, res, next) {
    Subscriber.paginate(req.queryObj, {
        sort: req.sortObj,
        page: req.query.page,
        limit: req.query.limit
    })
        .then(ret => {
            res.json({
                subscribers: ret.docs,
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
