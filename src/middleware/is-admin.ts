import { Next } from 'koa';
import * as Router from 'koa-router';

export function isAdmin(ctx: Router.IRouterContext, next: Next) {
  if (!ctx.state.user) {
    throw new Error('user_not_logged_in');
  }

  if (!ctx.state.user.isAdmin) {
    throw new Error('user_not_admin');
  }

  return next();
}
