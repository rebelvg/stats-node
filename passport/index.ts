import * as passport from 'passport';
import { OAuth2Strategy } from 'passport-google-oauth';

import { User } from '../models/user';
import * as googleKeys from '../google-keys.json';
import { stats } from '../config';

passport.use(
  new OAuth2Strategy(
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
