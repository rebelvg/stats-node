import Router from 'koa-router';

import { router as users } from '../routes/admin/users';
import { router as streamers } from '../routes/admin/streamers';
import { router as channels } from '../routes/admin/channels';
import { isLoggedIn } from '../middleware/is-logged-in';
import { isAdmin } from '../middleware/is-admin';

export const router = new Router();

router.use(isLoggedIn);
router.use(isAdmin);
router.use('/users', users.routes());
router.use('/streamers', streamers.routes());
router.use('/channels', channels.routes());
