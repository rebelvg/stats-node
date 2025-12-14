import { Next } from 'koa';
import * as Router from '@koa/router';
import { Unauthorized } from '../helpers/errors';

export function isLoggedIn(ctx: Router.RouterContext, next: Next) {
  if (ctx.state.user) {
    return next();
  }

  throw new Unauthorized('user_not_logged_in');
}
