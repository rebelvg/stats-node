import { Next } from 'koa';
import * as Router from 'koa-router';

export function isAdmin(ctx: Router.IRouterContext, next: Next) {
  if (ctx.state.user.isAdmin) {
    return next();
  }

  throw new Error('Not authorized.');
}
