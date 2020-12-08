import * as Router from 'koa-router';

import { graphs } from '../controllers/graphs';

export const router = new Router();

router.get('/', graphs);
