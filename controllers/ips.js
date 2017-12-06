const _ = require('lodash');

const IP = require('../models/ip');

function findById(req, res, next) {
    IP.findById(req.params.id)
        .then(async ip => {
            if (!ip) {
                throw new Error('IP not found.');
            }

            res.json({
                ip: ip
            });
        })
        .catch(next);
}

function find(req, res, next) {
    IP.paginate(req.queryObj, {
        sort: _.isEmpty(req.sortObj) ? {createdAt: -1} : req.sortObj,
        page: req.query.page,
        limit: req.query.limit
    })
        .then(async ret => {
            res.json({
                ips: ret.docs,
                options: {},
                info: {},
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
