function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    throw new Error('Not logged in.');
}

module.exports = isLoggedIn;
