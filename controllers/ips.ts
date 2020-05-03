import * as _ from 'lodash';

import { IP } from '../models/ip';

export function findById(req, res, next) {
  IP.findById(req.params.id)
    .then(ip => {
      if (!ip) {
        throw new Error('IP not found.');
      }

      res.json({
        ip: ip
      });
    })
    .catch(next);
}

export function find(req, res, next) {
  IP.paginate(req.queryObj, {
    sort: _.isEmpty(req.sortObj) ? { createdAt: -1 } : req.sortObj,
    page: req.query.page,
    limit: req.query.limit
  })
    .then(async ret => {
      const counties = await IP.distinct('api.country', req.queryObj);
      const cities = await IP.distinct('api.city', req.queryObj);
      const IPSs = await IP.distinct('api.isp', req.queryObj);

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