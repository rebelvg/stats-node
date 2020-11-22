import { Next } from 'koa';
import * as Router from 'koa-router';
import * as passport from 'koa-passport';

import { isLoggedIn } from '../middleware/is-logged-in';
import { stats } from '../config';
import { User } from '../models/user';
import { findById } from '../controllers/users';

export const router = new Router();

router.get('/', isLoggedIn, (ctx: Router.IRouterContext, next: Next) => {
  ctx.body = { user: ctx.state.user };
});

router.get('/:id', isLoggedIn, findById);

router.get(
  '/auth/google',
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
    const { _id, token, ipCreated } = ctx.state.user;

    await User.updateOne(
      {
        _id,
      },
      {
        ipCreated: ipCreated ? ipCreated : ctx.ip,
        ipUpdated: ctx.ip,
      },
    );

    ctx.redirect(stats.googleRedirect + `/?token=${token}`);
  },
);
