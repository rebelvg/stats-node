import { Next } from 'koa';
import * as Router from 'koa-router';

import { legacy, appChannelStats, channelStats, channels, list } from '../controllers/channels';
import { isLoggedIn } from '../middleware/is-logged-in';

export const router = new Router();

router.get('/legacy/:server/:channel', legacy);
router.get('/:server/:app/:channel', appChannelStats);
router.get('/:server/:channel', channelStats);
router.get('/', isLoggedIn, channels);
router.get('/list', list);
