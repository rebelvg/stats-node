import * as _ from 'lodash';

import { User } from '../../models/user';

export async function find(req, res, next) {
  const users = await User.find(null, null, {
    sort: {
      createdAt: -1
    }
  });

  res.json({
    users
  });
}

export async function update(req, res, next) {
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
