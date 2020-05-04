import { Next } from 'koa';
import * as Router from 'koa-router';
import * as passport from 'koa-passport';

import { isLoggedIn } from '../middleware/is-logged-in';
import { stats } from '../config';

export const router = new Router();

router.get('/', isLoggedIn, (ctx: Router.IRouterContext, next: Next) => {
  ctx.body = { user: ctx.state.user };
});
router.get(
  '/auth/google',
  passport.authenticate('google', {
    session: false,
    scope: [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  })
);
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (ctx: Router.IRouterContext, next: Next) => {
    const { token } = ctx.state.user;

    ctx.redirect(stats.googleRedirect + `/?token=${token}`);
  }
);
