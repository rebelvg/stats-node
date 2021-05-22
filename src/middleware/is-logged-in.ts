import { Next } from 'koa';
import * as Router from 'koa-router';
import { Unauthorized } from '../helpers/errors';
import { logger } from '../helpers/logger';

export function isLoggedIn(ctx: Router.IRouterContext, next: Next) {
  if (ctx.state.user) {
    return next();
  }

  logger.error('user_not_logged_in');

  throw new Unauthorized('user_not_logged_in');
}
