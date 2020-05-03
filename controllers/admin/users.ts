import * as _ from 'lodash';

import { User } from '../../models/user';

export function find(req, res, next) {
  User.find(null, null, {
    sort: {
      createdAt: -1
    }
  })
    .then(users => {
      res.json({
        users: users
      });
    })
    .catch(next);
}

export function update(req, res, next) {
  User.findOne({
    _id: req.params.id
  })
    .then(async user => {
      if (!user) {
        throw Error('User not found.');
      }

      _.forEach(req.body, (value, key) => {
        user[key] = value;
      });

      await user.save();

      res.json({
        user: user
      });
    })
    .catch(next);
}
