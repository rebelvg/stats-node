import { User } from '../models/user';

export function readToken(req, res, next) {
  const token = req.get('token');

  if (!token) {
    return next();
  }

  User.findOne({
    token
  })
    .then(user => {
      if (!user) {
        throw Error('User not found.');
      }

      req.user = user;

      next();
    })
    .catch(e => {
      next();
    });
}
