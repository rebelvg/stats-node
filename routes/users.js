const express = require('express');
const passport = require('passport');

const isLoggedIn = require('../middleware/isLoggedIn');
const stats = require('../config.json').stats;

let router = express.Router();

router.get('/', isLoggedIn, function (req, res, next) {
    res.send({user: req.user});
});
router.get('/auth/google', passport.authenticate('google', {
    scope: [
        'https://www.googleapis.com/auth/plus.login',
        'https://www.googleapis.com/auth/plus.me',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]
}));
router.get('/auth/google/callback', passport.authenticate('google'), function (req, res, next) {
    res.redirect(stats.googleRedirect);
});

module.exports = router;
