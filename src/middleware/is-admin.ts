import { Next } from 'koa';
import * as Router from 'koa-router';
import { Forbidden } from '../helpers/errors';
import { logger } from '../helpers/logger';

export function isAdmin(ctx: Router.IRouterContext, next: Next) {
  if (!ctx.state.user) {
    logger.error('user_not_logged_in');

    throw new Error('user_not_logged_in');
  }

  if (!ctx.state.user.isAdmin) {
    logger.error('user_not_admin');

    throw new Forbidden('user_not_admin');
  }

  return next();
}
