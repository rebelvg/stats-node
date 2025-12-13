import { Next } from 'koa';
import Router from '@koa/router';
import { Forbidden, Unauthorized } from '../helpers/errors';

export function isAdmin(ctx: Router.IRouterContext, next: Next) {
  if (!ctx.state.user) {
    throw new Unauthorized('user_not_logged_in');
  }

  if (!ctx.state.user.isAdmin) {
    throw new Forbidden('user_not_admin');
  }

  return next();
}
