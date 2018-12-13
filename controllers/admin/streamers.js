const _ = require('lodash');

const User = require('../../models/user');

function find(req, res, next) {
  User.find(
    {
      isStreamer: true
    },
    ['_id', 'name', 'streamKey']
  )
    .then(streamers => {
      res.json({
        streamers: streamers
      });
    })
    .catch(next);
}

exports.find = find;
