import { Next } from 'koa';
import Router from 'koa-router';
import { Unauthorized } from '../helpers/errors';

export function isLoggedIn(ctx: Router.IRouterContext, next: Next) {
  if (ctx.state.user) {
    return next();
  }

  throw new Unauthorized('user_not_logged_in');
}
