import { Next } from 'koa';
import * as Router from 'koa-router';

import { User, IUserModel } from '../models/user';

declare module 'koa' {
  // eslint-disable-next-line no-unused-vars
  interface Context {
    state: {
      user: IUserModel;
      [key: string]: any;
    };
  }
}

declare module 'koa-router' {
  // eslint-disable-next-line no-unused-vars
  interface IRouterContext {
    state: {
      user: IUserModel;
      [key: string]: any;
    };
  }
}

export async function readToken(ctx: Router.IRouterContext, next: Next) {
  const token = ctx.get('token');

  if (token) {
    const user = await User.findOne({
      token,
    });

    ctx.state.user = user;
  }

  await next();
}
