import * as express from 'express';

export function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.user.isAdmin) {
    return next();
  }

  throw new Error('Not authorized.');
}
