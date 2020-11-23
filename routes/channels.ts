import * as Router from 'koa-router';

import {
  appChannelStats,
  channelStats,
  channels,
  list,
} from '../controllers/channels';

export const router = new Router();

router.get('/:server/:app/:channel', appChannelStats);
router.get('/:server/:channel', channelStats);
router.get('/list', list);
router.get('/', channels);
