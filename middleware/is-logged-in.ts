import { Next } from 'koa';
import * as Router from 'koa-router';

export function isLoggedIn(ctx: Router.IRouterContext, next: Next) {
  if (ctx.state.user) {
    return next();
  }

  throw new Error('Not logged in.');
}
