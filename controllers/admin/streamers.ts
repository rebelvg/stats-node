import { User } from '../../models/user';

export async function find(req, res, next) {
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
