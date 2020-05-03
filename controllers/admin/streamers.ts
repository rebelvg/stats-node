import { User } from '../../models/user';

export function find(req, res, next) {
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
