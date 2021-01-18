import { Next } from 'koa';
import * as Router from 'koa-router';

import { userService } from '../../services/user';

export async function find(ctx: Router.IRouterContext, next: Next) {
  const streamers = await userService.findStreamers();

  ctx.body = {
    streamers,
  };
}
