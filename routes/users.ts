import express from 'express';
import passport from 'passport';

import { isLoggedIn } from '../middleware/is-logged-in';
import { stats } from '../config';

export const router = express.Router();

router.get('/', isLoggedIn, (req, res, next) => {
  res.send({ user: req.user });
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
router.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res, next) => {
  const { token } = req.user as any;

  res.redirect(stats.googleRedirect + `/?token=${token}`);
});
