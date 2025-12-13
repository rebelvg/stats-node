import Router from '@koa/router';

import { appChannelStats, channels, list } from '../controllers/channels';
import { isAdmin } from '../middleware/is-admin';

export const router = new Router();

router.get('/:server/:app/:channel', appChannelStats);
router.get('/list', isAdmin, list);
router.get('/', isAdmin, channels);
