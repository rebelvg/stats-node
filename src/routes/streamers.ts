import Router from 'koa-router';

import { find } from '../controllers/streamers';

export const router = new Router();

router.get('/', find);
