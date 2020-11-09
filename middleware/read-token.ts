import { Next } from 'koa';
import * as Router from 'koa-router';

import { User, IUserModel } from '../models/user';

declare module 'koa' {
  interface Context {
    state: {
      user: IUserModel;
      [key: string]: any;
    };
  }
}

declare module 'koa-router' {
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
