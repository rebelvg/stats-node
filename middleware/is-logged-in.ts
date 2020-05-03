export function isLoggedIn(req, res, next) {
  if (req.user) {
    return next();
  }

  throw new Error('Not logged in.');
}
