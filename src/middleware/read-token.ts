import { Next } from 'koa';
import * as Router from 'koa-router';
import { ObjectId } from 'mongodb';

import { decodeJwtToken } from '../helpers/jwt';
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
  const jwtToken = ctx.get('jwt-token');

  logger.child({
    token,
    jwtToken,
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

  if (jwtToken) {
    try {
      const { userId } = decodeJwtToken(jwtToken);

      const user = await User.findOne({
        _id: new ObjectId(userId),
      });

      ctx.state.user = user;

      logger.child({
        user: user?._id,
      });
    } catch (error) {
      logger.warn('jwt_token_warn', { href: ctx.href, jwtToken, error });
    }
  }

  await next();
}
