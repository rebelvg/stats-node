const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const User = require('../models/user');
const googleKeys = require('../google-keys');
const stats = require('../config.json').stats;

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id).then((user) => {
        if (!user) throw Error('User not found.');

        done(null, user);
    }).catch((e) => {
        done(e, null);
    });
});

passport.use(new GoogleStrategy({
    clientID: googleKeys.web.client_id,
    clientSecret: googleKeys.web.client_secret,
    callbackURL: `http://${stats.googleCallbackHost}/users/auth/google/callback`
}, function (accessToken, refreshToken, profile, done) {
    User.findOne({
        googleId: profile.id
    })
        .then(async (user) => {
            if (user) {
                user.emails = profile.emails;
                user.name = profile.displayName;

                await user.save();

                return done(null, user);
            }

            User.create({
                googleId: profile.id,
                emails: profile.emails,
                name: profile.displayName
            })
                .then((user) => {
                    return done(null, user);

                })
                .catch(done);
        })
        .catch(done);
}));
