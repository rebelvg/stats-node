import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { IP } from '../models/ip';

export async function findById(ctx: Router.IRouterContext, next: Next) {
  const ip = await IP.findById(ctx.params.id);

  if (!ip) {
    throw new Error('IP not found.');
  }

  ctx.body = {
    ip,
  };
}

export async function find(ctx: Router.IRouterContext, next: Next) {
  const paginatedIps = await IP.paginate(ctx.queryObj, {
    sort: _.isEmpty(ctx.sortObj) ? { createdAt: -1 } : ctx.sortObj,
    page: parseInt(ctx.query.page as string),
    limit: parseInt(ctx.query.limit as string),
  });

  const counties = await IP.distinct('api.country', ctx.queryObj);
  const cities = await IP.distinct('api.city', ctx.queryObj);
  const ISPs = await IP.distinct('api.isp', ctx.queryObj);
  const uniqueApiMessages = await IP.distinct('api.message', ctx.queryObj);

  ctx.body = {
    ips: paginatedIps.docs,
    options: {
      countries: _.concat(counties, uniqueApiMessages),
      cities: cities,
      ISPs,
    },
    info: {
      totalCountries: counties.length,
      totalCities: cities.length,
      totalISPs: ISPs.length,
    },
    total: paginatedIps.total,
    limit: paginatedIps.limit,
    page: paginatedIps.page,
    pages: paginatedIps.pages,
  };
}
