import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { IP } from '../models/ip';
import { ObjectId } from 'mongodb';

export async function findById(ctx: Router.RouterContext, next: Next) {
  const ip = IP.findOne({
    _id: new ObjectId(ctx.params.id),
  });

  if (!ip) {
    throw new Error('ip_not_found');
  }

  ctx.body = {
    ip,
  };
}

export async function find(ctx: Router.RouterContext, next: Next) {
  const limit = parseInt(ctx.query.limit as string) || 20;
  const page = parseInt(ctx.query.page as string) || 1;
  const skip = (page - 1) * limit;

  const paginatedIps = await IP.paginate(ctx.ctx.state.query, {
    sort: _.isEmpty(ctx.state.sort) ? { createdAt: -1 } : ctx.state.sort,
    skip,
    limit,
  });

  const counties = await IP.distinct('api.country', ctx.ctx.state.query);
  const cities = await IP.distinct('api.city', ctx.ctx.state.query);
  const ISPs = await IP.distinct('api.isp', ctx.ctx.state.query);
  const uniqueApiMessages = await IP.distinct(
    'api.message',
    ctx.ctx.state.query,
  );

  ctx.body = {
    ips: paginatedIps.docs,
    options: {
      countries: _.concat(counties, uniqueApiMessages),
      cities,
      ISPs,
    },
    info: {
      totalCountries: counties.length,
      totalCities: cities.length,
      totalISPs: ISPs.length,
    },
    total: paginatedIps.total,
    limit,
    page,
    pages: Math.ceil(paginatedIps.total / limit),
  };
}
