import * as Router from 'koa-router';

import {
  legacy,
  appChannelStats,
  channelStats,
  channels,
  list,
} from '../controllers/channels';

export const router = new Router();

router.get('/legacy/:server/:channel', legacy);
router.get('/:server/:app/:channel', appChannelStats);
router.get('/:server/:channel', channelStats);
router.get('/', channels);
router.get('/list', list);
