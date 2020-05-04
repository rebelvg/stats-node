import * as express from 'express';

export function asyncMiddleware(fn) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    return Promise.resolve(fn(req, res, next).catch(next));
  };
}
