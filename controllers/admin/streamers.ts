import { Next } from 'koa';
import * as Router from 'koa-router';

import { User } from '../../models/user';

export async function find(ctx: Router.IRouterContext, next: Next) {
  const streamers = await User.find(
    {
      isStreamer: true,
    },
    ['_id', 'name', 'streamKey'],
  );

  ctx.body = {
    streamers,
  };
}
