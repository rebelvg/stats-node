import * as passport from 'koa-passport';
import { Strategy } from 'passport-google-oauth20';

import { User } from '../models/user';
import { API, GOOGLE_OAUTH } from '../config';

passport.use(
  new Strategy(
    {
      clientID: GOOGLE_OAUTH.CLIENT_ID,
      clientSecret: GOOGLE_OAUTH.CLIENT_SECRET,
      callbackURL: `${API.GOOGLE_CALLBACK_HOST}/users/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({
          googleId: profile.id,
        });

        if (user) {
          user.raw = {
            profile,
            accessToken,
            refreshToken,
          };

          await user.save();

          return done(null, user);
        }

        const firstName =
          profile.displayName?.split(' ')[0] ?? 'NO_DISPLAY_NAME';

        const newUser = await User.create({
          googleId: profile.id,
          name: firstName,
          raw: {
            profile,
            accessToken,
            refreshToken,
          },
        });

        return done(null, newUser);
      } catch (error) {
        done(error);
      }
    },
  ),
);
