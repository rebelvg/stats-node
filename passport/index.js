const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const User = require('../models/user');
const googleKeys = require('../google-keys');
const stats = require('../config').stats;

passport.use(
  new GoogleStrategy(
    {
      clientID: googleKeys.web.client_id,
      clientSecret: googleKeys.web.client_secret,
      callbackURL: `${stats.googleCallbackHost}/users/auth/google/callback`,
      passReqToCallback: true
    },
    (req, accessToken, refreshToken, profile, done) => {
      User.findOne({
        googleId: profile.id
      })
        .then(async user => {
          if (user) {
            user.emails = profile.emails;
            user.name = profile.displayName;
            user.ipUpdated = req.ip;

            await user.save();

            return done(null, user);
          }

          User.create({
            googleId: profile.id,
            emails: profile.emails,
            name: profile.displayName,
            ipCreated: req.ip,
            ipUpdated: req.ip
          })
            .then(user => {
              return done(null, user);
            })
            .catch(done);
        })
        .catch(done);
    }
  )
);
