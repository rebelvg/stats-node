import * as Router from 'koa-router';

import { find } from '../../controllers/admin/streamers';

export const router = new Router();

router.get('/', find);
