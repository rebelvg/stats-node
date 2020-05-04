import * as passport from 'koa-passport';
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
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({
          googleId: profile.id
        });

        if (user) {
          user.emails = profile.emails;
          user.name = profile.displayName;
          user.ipUpdated = req.ip;

          await user.save();

          return done(null, user);
        }

        const newUser = await User.create({
          googleId: profile.id,
          emails: profile.emails,
          name: profile.displayName,
          ipCreated: req.ip,
          ipUpdated: req.ip
        });

        return done(null, newUser);
      } catch (error) {
        done(error);
      }
    }
  )
);
