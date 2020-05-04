import * as _ from 'lodash';

import { IP } from '../models/ip';

export async function findById(req, res, next) {
  const ip = await IP.findById(req.params.id);

  if (!ip) {
    throw new Error('IP not found.');
  }

  res.json({
    ip
  });
}

export async function find(req, res, next) {
  const paginatedIps = await IP.paginate(req.queryObj, {
    sort: _.isEmpty(req.sortObj) ? { createdAt: -1 } : req.sortObj,
    page: req.query.page,
    limit: req.query.limit
  });

  const counties = await IP.distinct('api.country', req.queryObj);
  const cities = await IP.distinct('api.city', req.queryObj);
  const IPSs = await IP.distinct('api.isp', req.queryObj);

  res.json({
    ips: paginatedIps.docs,
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
    total: paginatedIps.total,
    limit: paginatedIps.limit,
    page: paginatedIps.page,
    pages: paginatedIps.pages
  });
}
