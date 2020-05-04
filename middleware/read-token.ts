import * as express from 'express';

import { User, IUserModel } from '../models/user';

declare module 'express' {
  interface Request {
    user: IUserModel;
  }
}

export async function readToken(req: express.Request, res: express.Response, next: express.NextFunction) {
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
