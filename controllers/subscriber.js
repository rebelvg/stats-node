const Subscriber = require('../models/subscriber');
const Stream = require('../models/stream');

function findById(req, res, next) {
    Subscriber.findById(req.params.id)
        .then(async subscriber => {
            if (!subscriber) {
                throw new Error('Subscriber not found.');
            }

            let stream = await subscriber.getStream();

            res.json({subscriber: subscriber, stream: stream});
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
