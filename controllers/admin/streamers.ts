import * as express from 'express';

import { User } from '../../models/user';

export async function find(req: express.Request, res: express.Response, next: express.NextFunction) {
  const streamers = await User.find(
    {
      isStreamer: true
    },
    ['_id', 'name', 'streamKey']
  );

  res.json({
    streamers
  });
}
