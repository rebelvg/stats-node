const express = require('express');
const passport = require('passport');

const isLoggedIn = require('../middleware/is-logged-in');
const { stats } = require('../config.json');

const router = express.Router();

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
  const { token } = req.user;

  res.cookie('stats-token', token, {
    maxAge: 365 * 24 * 60 * 60 * 1000
  });

  res.redirect(stats.googleRedirect + `/?token=${token}`);
});

module.exports = router;
