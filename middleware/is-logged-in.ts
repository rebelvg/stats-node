import * as express from 'express';

export function isLoggedIn(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.user) {
    return next();
  }

  throw new Error('Not logged in.');
}
