export function isAdmin(req, res, next) {
  if (req.user.isAdmin) {
    return next();
  }

  throw new Error('Not authorized.');
}
