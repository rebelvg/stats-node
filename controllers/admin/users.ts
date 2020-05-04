import * as express from 'express';
import * as _ from 'lodash';

import { User } from '../../models/user';

export async function find(req: express.Request, res: express.Response, next: express.NextFunction) {
  const users = await User.find(null, null, {
    sort: {
      createdAt: -1
    }
  });

  res.json({
    users
  });
}

export async function update(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await User.findOne({
    _id: req.params.id
  });

  if (!user) {
    throw Error('User not found.');
  }

  _.forEach(req.body, (value, key) => {
    user[key] = value;
  });

  await user.save();

  res.json({
    user
  });
}
