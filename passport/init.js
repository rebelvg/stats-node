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
        .then((user) => {
            if (user) return done(null, user);

            User.create({
                googleId: profile.id,
                name: profile.displayName

            })
                .then((user) => {
                    return done(null, user);

                })
                .catch(done);
        })
        .catch(done);
}));
