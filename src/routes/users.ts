import { Next } from 'koa';
import * as Router from 'koa-router';
import * as passport from 'koa-passport';

import { isLoggedIn } from '../middleware/is-logged-in';
import { User } from '../models/user';
import { findById } from '../controllers/users';
import { encodeJwtToken } from '../helpers/jwt';

export const router = new Router();

router.get(
  '/validate',
  isLoggedIn,
  (ctx: Router.IRouterContext, next: Next) => {
    ctx.body = {};
  },
);

router.get('/refresh', isLoggedIn, (ctx: Router.IRouterContext, next: Next) => {
  const { _id } = ctx.state.user;

  const jwtToken = encodeJwtToken({
    userId: _id,
  });

  ctx.body = {
    jwtToken,
  };
});

router.get('/', isLoggedIn, (ctx: Router.IRouterContext, next: Next) => {
  ctx.body = { user: ctx.state.user };
});

router.get('/:id', findById);

router.get(
  '/auth/google',
  (ctx, next) => {
    const { redirectUri } = ctx.query;

    ctx.session.redirectUri = decodeURIComponent(redirectUri as string);

    next();
  },
  passport.authenticate('google', {
    session: false,
    scope: [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  }),
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  async (ctx: Router.IRouterContext, next: Next) => {
    const { _id, ipCreated } = ctx.state.user;
    const { redirectUri } = ctx.session;

    await User.updateOne(
      {
        _id,
      },
      {
        ipCreated: ipCreated ? ipCreated : ctx.ip,
        ipUpdated: ctx.ip,
      },
    );

    const jwtToken = encodeJwtToken({
      userId: _id,
    });

    ctx.redirect(`${redirectUri}${jwtToken}`);
  },
);
