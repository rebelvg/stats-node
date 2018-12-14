const _ = require('lodash');

const User = require('../../models/user');

function find(req, res, next) {
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

function update(req, res, next) {
  User.findOne({
    _id: req.params.id
  })
    .then(async user => {
      if (!user) {throw Error('User not found.');}

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

exports.find = find;
exports.update = update;
