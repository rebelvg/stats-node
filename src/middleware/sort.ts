import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';
import { SortDirection } from 'mongodb';

export function parseSort(allowedKeys: string[]) {
  return async function (ctx: Router.RouterContext, next: Next) {
    const sort: [string, SortDirection][] = [];

    if (_.isArray(ctx.query.sort)) {
      _.forEach(ctx.query.sort, (sortKey) => {
        _.forEach(allowedKeys, (path) => {
          switch (sortKey) {
            case `-${path}`: {
              sort.push([path, 'desc']);

              break;
            }
            case path: {
              sort.push([path, 'asc']);

              break;
            }
          }
        });
      });
    }

    ctx.state.sort = sort;

    await next();
  };
}
