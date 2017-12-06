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
            let counties = await IP.distinct('api.country', req.queryObj);
            let cities = await IP.distinct('api.city', req.queryObj);
            let IPSs = await IP.distinct('api.isp', req.queryObj);

            res.json({
                ips: ret.docs,
                options: {
                    countries: _.concat(counties, await IP.distinct('api.message', req.queryObj)),
                    cities: cities,
                    ISPs: IPSs
                },
                info: {
                    totalCountries: counties.length,
                    totalCities: cities.length,
                    totalISPs: IPSs.length
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
