import { User } from '../models/user';

export async function readToken(req, res, next) {
  const token = req.get('token');

  if (!token) {
    return next();
  }

  const user = await User.findOne({
    token
  });

  req.user = user;

  next();
}
