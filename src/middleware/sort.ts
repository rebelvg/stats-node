import { Next } from 'koa';
import Router from '@koa/router';
import _ from 'lodash';

const allowedPaths = ['api.country', 'api.city', 'api.isp'];

declare module '@koa/router' {
  export interface IRouterContext {
    sortObj: any;
  }
}

export function parseSort(model) {
  return async function (ctx: Router.IRouterContext, next: Next) {
    const sortObj = {};

    if (_.isArray(ctx.query.sort)) {
      _.forEach(ctx.query.sort, (sort) => {
        _.forEach(
          _.concat(_.keys(model.schema.paths), allowedPaths),
          (path) => {
            switch (sort) {
              case `-${path}`: {
                sortObj[path] = -1;
                break;
              }
              case path: {
                sortObj[path] = 1;
                break;
              }
            }
          },
        );
      });
    }

    ctx.sortObj = sortObj;

    await next();
  };
}
