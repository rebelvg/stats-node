import * as passport from 'koa-passport';
import { Strategy } from 'passport-google-oauth20';

import { User } from '../models/user';
import { API, GOOGLE_KEYS } from '../../config';

passport.use(
  new Strategy(
    {
      clientID: GOOGLE_KEYS.CLIENT_ID,
      clientSecret: GOOGLE_KEYS.CLIENT_SECRET,
      callbackURL: `${API.GOOGLE_CALLBACK_HOST}/users/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({
          googleId: profile.id,
        });

        if (user) {
          user.emails = profile.emails;
          user.name = profile.displayName;

          await user.save();

          return done(null, user);
        }

        const newUser = await User.create({
          googleId: profile.id,
          emails: profile.emails,
          name: profile.displayName,
        });

        return done(null, newUser);
      } catch (error) {
        done(error);
      }
    },
  ),
);
