const express = require('express');
const passport = require('passport');

const isLoggedIn = require('../middleware/isLoggedIn');

let router = express.Router();

router.get('/', isLoggedIn, function (req, res, next) {
    res.json({
        user: req.user
    });
});
router.get('/auth/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/plus.login']}));
router.get('/auth/google/callback', passport.authenticate('google'), function (req, res, next) {
    res.send(`Google user ${req.user.googleId} logged in.`);
});

module.exports = router;
