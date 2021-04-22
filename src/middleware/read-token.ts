import { Next } from 'koa';
import * as Router from 'koa-router';
import { logger } from '../helpers/logger';

import { User, IUserModel } from '../models/user';

declare module 'koa' {
  export interface Context {
    state: {
      user: IUserModel;
      [key: string]: any;
    };
  }
}

declare module 'koa-router' {
  export interface IRouterContext {
    state: {
      user: IUserModel;
      [key: string]: any;
    };
  }
}

export async function readToken(ctx: Router.IRouterContext, next: Next) {
  const token = ctx.get('token');

  logger.child({
    token,
  });

  if (token) {
    const user = await User.findOne({
      token,
    });

    ctx.state.user = user;

    logger.child({
      user: user?._id,
    });
  }

  await next();
}
